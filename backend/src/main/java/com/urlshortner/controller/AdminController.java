package com.urlshortner.controller;

import com.urlshortner.dto.AdminStatsResponse;
import com.urlshortner.dto.AdminUserDetailResponse;
import com.urlshortner.dto.AdminUserSummaryResponse;
import com.urlshortner.dto.LatencyInsightResponse;
import com.urlshortner.entity.User;
import com.urlshortner.service.AdminService;
import com.urlshortner.service.LatencyInsightService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * All routes here are additionally gated to ROLE_ADMIN in SecurityConfig —
 * controller-level checks are not required, but callers must be authenticated admins.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final LatencyInsightService latencyInsightService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> stats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    /** AI-generated (Gemini) health summary of recent redirect latency. */
    @GetMapping("/latency-insight")
    public ResponseEntity<LatencyInsightResponse> latencyInsight() {
        return ResponseEntity.ok(latencyInsightService.generateInsight());
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserSummaryResponse>> listUsers() {
        return ResponseEntity.ok(adminService.listUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<AdminUserDetailResponse> userDetail(@PathVariable String id) {
        return ResponseEntity.ok(adminService.getUserDetail(id));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id, @AuthenticationPrincipal User caller) {
        adminService.deleteUser(id, caller);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{id}/promote")
    public ResponseEntity<AdminUserSummaryResponse> promote(@PathVariable String id) {
        return ResponseEntity.ok(adminService.promoteToAdmin(id));
    }
}
