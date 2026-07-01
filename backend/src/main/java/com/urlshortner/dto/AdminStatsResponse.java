package com.urlshortner.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminStatsResponse {
    private long totalUsers;
    private long totalAdmins;
    private long totalUrls;
    private long totalClicks;
}
