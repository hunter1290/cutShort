package com.urlshortner.service;

import com.urlshortner.dto.UrlResponse;
import com.urlshortner.dto.ShortenRequest;
import com.urlshortner.entity.Url;
import com.urlshortner.entity.User;
import com.urlshortner.exception.AppException;
import com.urlshortner.repository.UrlRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UrlService {

    private final UrlRepository urlRepository;

    @Value("${app.base-url}")
    private String baseUrl;

    @Value("${app.anonymous-expiry-days}")
    private int anonymousExpiryDays;

    private static final String ALPHABET =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 7;
    private static final SecureRandom RANDOM = new SecureRandom();

    // ─── Shorten ─────────────────────────────────────────────────────────────

    @Transactional
    public UrlResponse shorten(ShortenRequest req, User caller) {
        String code = resolveCode(req, caller);
        LocalDateTime expiresAt = resolveExpiry(req, caller);

        Url url = Url.builder()
                .shortCode(code)
                .originalUrl(req.getOriginalUrl())
                .user(caller)
                .expiresAt(expiresAt)
                .build();

        url = urlRepository.save(url);
        return toResponse(url, caller != null);
    }

    // ─── Redirect ─────────────────────────────────────────────────────────────

    @Transactional
    public String resolve(String code) {
        Url url = urlRepository.findByShortCodeAndActiveTrue(code)
                .orElseThrow(() -> AppException.notFound("Short link not found or has been removed"));

        if (url.isExpired()) {
            throw AppException.badRequest("This link has expired");
        }

        urlRepository.incrementClickCount(url.getId());
        return url.getOriginalUrl();
    }

    // ─── Dashboard: list ──────────────────────────────────────────────────────

    public List<UrlResponse> getUserUrls(User user) {
        return urlRepository.findByUserAndActiveTrueOrderByCreatedAtDesc(user)
                .stream()
                .map(u -> toResponse(u, true))
                .toList();
    }

    /** All links for a user, including inactive/deleted ones — used by the admin dashboard. */
    public List<UrlResponse> getAllUrlsForUserAdmin(User user) {
        return urlRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(u -> toResponse(u, true))
                .toList();
    }

    // ─── Credential-gated: extend expiry ─────────────────────────────────────

    @Transactional
    public UrlResponse extendExpiry(String code, int days, User caller) {
        Url url = ownedUrl(code, caller);

        LocalDateTime base = (url.getExpiresAt() != null && url.getExpiresAt().isAfter(LocalDateTime.now()))
                ? url.getExpiresAt()
                : LocalDateTime.now();

        url.setExpiresAt(base.plusDays(days));
        url = urlRepository.save(url);
        return toResponse(url, true);
    }

    // ─── Credential-gated: change custom short code ───────────────────────────

    @Transactional
    public UrlResponse changeCode(String currentCode, String newCode, User caller) {
        Url url = ownedUrl(currentCode, caller);

        if (urlRepository.existsByShortCode(newCode)) {
            throw AppException.conflict("That short code is already taken");
        }

        url.setShortCode(newCode);
        url = urlRepository.save(url);
        return toResponse(url, true);
    }

    // ─── Delete ───────────────────────────────────────────────────────────────

    @Transactional
    public void delete(String code, User caller) {
        Url url = ownedUrl(code, caller);
        url.setActive(false);
        urlRepository.save(url);
    }

    // ─── Internals ────────────────────────────────────────────────────────────

    private String resolveCode(ShortenRequest req, User caller) {
        if (req.getCustomCode() != null && !req.getCustomCode().isBlank()) {
            if (caller == null) {
                throw AppException.forbidden("Custom short codes require an account — please log in");
            }
            if (urlRepository.existsByShortCode(req.getCustomCode())) {
                throw AppException.conflict("That short code is already taken");
            }
            return req.getCustomCode();
        }
        return generateUniqueCode();
    }

    private LocalDateTime resolveExpiry(ShortenRequest req, User caller) {
        if (req.getExpiresAt() != null) {
            if (caller == null) {
                throw AppException.forbidden("Custom expiry dates require an account — please log in");
            }
            if (req.getExpiresAt().isBefore(LocalDateTime.now())) {
                throw AppException.badRequest("Expiry date must be in the future");
            }
            return req.getExpiresAt();
        }
        // Anonymous links always expire; authenticated links have no default expiry
        return caller == null ? LocalDateTime.now().plusDays(anonymousExpiryDays) : null;
    }

    private Url ownedUrl(String code, User caller) {
        Url url = urlRepository.findByShortCodeAndActiveTrue(code)
                .orElseThrow(() -> AppException.notFound("URL not found"));

        if (url.getUser() == null || !url.getUser().getId().equals(caller.getId())) {
            throw AppException.forbidden("You do not have permission to modify this link");
        }
        return url;
    }

    private String generateUniqueCode() {
        String code;
        do {
            code = randomCode();
        } while (urlRepository.existsByShortCode(code));
        return code;
    }

    private String randomCode() {
        StringBuilder sb = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }

    private UrlResponse toResponse(Url url, boolean ownedByUser) {
        return UrlResponse.builder()
                .id(url.getId())
                .shortCode(url.getShortCode())
                .shortUrl(baseUrl + "/" + url.getShortCode())
                .originalUrl(url.getOriginalUrl())
                .clickCount(url.getClickCount())
                .createdAt(url.getCreatedAt())
                .expiresAt(url.getExpiresAt())
                .ownedByUser(ownedByUser)
                .build();
    }
}
