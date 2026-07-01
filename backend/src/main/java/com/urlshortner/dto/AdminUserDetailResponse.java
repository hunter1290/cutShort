package com.urlshortner.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class AdminUserDetailResponse {
    private String id;
    private String email;
    private String displayName;
    private String role;
    private LocalDateTime createdAt;
    private long urlCount;
    private long totalClicks;
    private List<UrlResponse> urls;
}
