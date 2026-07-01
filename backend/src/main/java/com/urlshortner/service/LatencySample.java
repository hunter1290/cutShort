package com.urlshortner.service;

import java.time.LocalDateTime;

public record LatencySample(String shortCode, long latencyMs, LocalDateTime recordedAt) {
}
