package com.urlshortner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class LatencyStatsResponse {
    private int sampleCount;
    private double avgMs;
    private long minMs;
    private long maxMs;
    private long p95Ms;
}
