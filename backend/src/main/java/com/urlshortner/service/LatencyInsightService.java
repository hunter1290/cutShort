package com.urlshortner.service;

import com.urlshortner.dto.LatencyInsightResponse;
import com.urlshortner.dto.LatencyStatsResponse;
import com.urlshortner.gemini.GeminiClient;
import com.urlshortner.gemini.GeminiUnavailableException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LatencyInsightService {

    private final LatencyTrackingService latencyTrackingService;
    private final GeminiClient geminiClient;

    public LatencyInsightResponse generateInsight() {
        List<LatencySample> samples = latencyTrackingService.snapshot();

        if (samples.isEmpty()) {
            return LatencyInsightResponse.builder()
                    .stats(LatencyStatsResponse.builder().sampleCount(0).avgMs(0).minMs(0).maxMs(0).p95Ms(0).build())
                    .aiSummary("Not enough redirect traffic yet to generate an insight.")
                    .build();
        }

        LatencyStatsResponse stats = computeStats(samples);

        String aiSummary;
        try {
            aiSummary = geminiClient.generateContent(buildPrompt(stats, samples), false);
        } catch (GeminiUnavailableException e) {
            aiSummary = "AI insight unavailable: " + e.getMessage();
        }

        return LatencyInsightResponse.builder().stats(stats).aiSummary(aiSummary).build();
    }

    private LatencyStatsResponse computeStats(List<LatencySample> samples) {
        long[] sorted = samples.stream().mapToLong(LatencySample::latencyMs).sorted().toArray();
        double avg = samples.stream().mapToLong(LatencySample::latencyMs).average().orElse(0);
        long min = sorted[0];
        long max = sorted[sorted.length - 1];
        int p95Index = Math.min(sorted.length - 1, (int) Math.ceil(sorted.length * 0.95) - 1);
        long p95 = sorted[p95Index];

        return LatencyStatsResponse.builder()
                .sampleCount(samples.size())
                .avgMs(Math.round(avg * 100) / 100.0)
                .minMs(min)
                .maxMs(max)
                .p95Ms(p95)
                .build();
    }

    private String buildPrompt(LatencyStatsResponse stats, List<LatencySample> samples) {
        String slowest = samples.stream()
                .sorted(Comparator.comparingLong(LatencySample::latencyMs).reversed())
                .limit(5)
                .map(s -> s.shortCode() + "=" + s.latencyMs() + "ms")
                .reduce((a, b) -> a + ", " + b)
                .orElse("none");

        return """
                You are monitoring redirect latency for a URL shortener service.
                Recent redirect latency stats (in milliseconds), over the last %d redirects:
                - average: %.2fms
                - min: %dms
                - max: %dms
                - p95: %dms
                Slowest individual redirects: %s

                In 2-3 short sentences, tell an engineer whether this looks healthy and call out
                anything that looks like an anomaly worth investigating. Be concise and concrete,
                no preamble.
                """.formatted(stats.getSampleCount(), stats.getAvgMs(), stats.getMinMs(),
                stats.getMaxMs(), stats.getP95Ms(), slowest);
    }
}
