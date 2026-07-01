package com.urlshortner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class LatencyInsightResponse {
    private LatencyStatsResponse stats;
    private String aiSummary;
}
