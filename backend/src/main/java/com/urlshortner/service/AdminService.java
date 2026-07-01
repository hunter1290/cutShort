package com.urlshortner.service;

import com.urlshortner.dto.AdminStatsResponse;
import com.urlshortner.dto.AdminUserDetailResponse;
import com.urlshortner.dto.AdminUserSummaryResponse;
import com.urlshortner.entity.Role;
import com.urlshortner.entity.User;
import com.urlshortner.exception.AppException;
import com.urlshortner.repository.UrlRepository;
import com.urlshortner.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final UrlRepository urlRepository;
    private final UrlService urlService;

    public List<AdminUserSummaryResponse> listUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::toSummary)
                .toList();
    }

    public AdminUserDetailResponse getUserDetail(String userId) {
        User user = findUser(userId);

        return AdminUserDetailResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt())
                .urlCount(urlRepository.countByUser(user))
                .totalClicks(urlRepository.sumClickCountByUser(user))
                .urls(urlService.getAllUrlsForUserAdmin(user))
                .build();
    }

    @Transactional
    public void deleteUser(String userId, User caller) {
        if (userId.equals(caller.getId())) {
            throw AppException.forbidden("You cannot delete your own admin account");
        }
        User user = findUser(userId);
        userRepository.delete(user);
    }

    @Transactional
    public AdminUserSummaryResponse promoteToAdmin(String userId) {
        User user = findUser(userId);
        user.setRole(Role.ADMIN);
        user = userRepository.save(user);
        return toSummary(user);
    }

    public AdminStatsResponse getStats() {
        return AdminStatsResponse.builder()
                .totalUsers(userRepository.count())
                .totalAdmins(userRepository.countByRole(Role.ADMIN))
                .totalUrls(urlRepository.count())
                .totalClicks(urlRepository.sumClickCount())
                .build();
    }

    private User findUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("User not found"));
    }

    private AdminUserSummaryResponse toSummary(User user) {
        return AdminUserSummaryResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt())
                .urlCount(urlRepository.countByUser(user))
                .totalClicks(urlRepository.sumClickCountByUser(user))
                .build();
    }
}
