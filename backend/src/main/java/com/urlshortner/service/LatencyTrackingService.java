package com.urlshortner.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;

/**
 * In-memory rolling window of recent redirect latencies. Deliberately not persisted —
 * this only feeds the admin latency insight, so a restart losing history is fine, and
 * it keeps the redirect hot path free of any DB write.
 */
@Service
public class LatencyTrackingService {

    private static final int MAX_SAMPLES = 500;

    private final Deque<LatencySample> samples = new ArrayDeque<>(MAX_SAMPLES);

    public synchronized void record(String shortCode, long latencyMs) {
        if (samples.size() >= MAX_SAMPLES) {
            samples.removeFirst();
        }
        samples.addLast(new LatencySample(shortCode, latencyMs, LocalDateTime.now()));
    }

    public synchronized List<LatencySample> snapshot() {
        return List.copyOf(samples);
    }
}
