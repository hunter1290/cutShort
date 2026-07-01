package com.urlshortner.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminUserSummaryResponse {
    private String id;
    private String email;
    private String displayName;
    private String role;
    private LocalDateTime createdAt;
    private long urlCount;
    private long totalClicks;
}
