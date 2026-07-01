package com.urlshortner.controller;

import com.urlshortner.dto.ChangeCodeRequest;
import com.urlshortner.dto.ExtendExpiryRequest;
import com.urlshortner.dto.ShortenRequest;
import com.urlshortner.dto.SuggestCodeRequest;
import com.urlshortner.dto.SuggestCodeResponse;
import com.urlshortner.dto.UrlResponse;
import com.urlshortner.entity.User;
import com.urlshortner.service.CodeSuggestionService;
import com.urlshortner.service.UrlService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/urls")
@RequiredArgsConstructor
public class UrlController {

    private final UrlService urlService;
    private final CodeSuggestionService codeSuggestionService;

    /**
     * Open to all. Anonymous callers may not use customCode or expiresAt —
     * the service enforces this and returns 403 with a human-readable message.
     */
    @PostMapping("/shorten")
    public ResponseEntity<UrlResponse> shorten(
            @Valid @RequestBody ShortenRequest req,
            Authentication authentication
    ) {
        User caller = resolveUser(authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(urlService.shorten(req, caller));
    }

    /**
     * AI-suggested (Gemini) memorable short codes for a destination URL, as an alternative
     * to the random hash — open to all, same as shortening itself. Returns an empty list
     * (never an error) if Gemini is unavailable.
     */
    @PostMapping("/suggest-code")
    public ResponseEntity<SuggestCodeResponse> suggestCode(@Valid @RequestBody SuggestCodeRequest req) {
        return ResponseEntity.ok(SuggestCodeResponse.builder()
                .suggestions(codeSuggestionService.suggest(req.getOriginalUrl()))
                .build());
    }

    /** List the authenticated user's own links. */
    @GetMapping
    public ResponseEntity<List<UrlResponse>> myUrls(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(urlService.getUserUrls(user));
    }

    /** Soft-delete a link owned by the caller. */
    @DeleteMapping("/{code}")
    public ResponseEntity<Void> delete(
            @PathVariable String code,
            @AuthenticationPrincipal User user
    ) {
        urlService.delete(code, user);
        return ResponseEntity.noContent().build();
    }

    // ─── Credential-gated ────────────────────────────────────────────────────

    /** Extend the expiry of an owned link — authenticated users only. */
    @PatchMapping("/{code}/extend")
    public ResponseEntity<UrlResponse> extendExpiry(
            @PathVariable String code,
            @Valid @RequestBody ExtendExpiryRequest req,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(urlService.extendExpiry(code, req.getDays(), user));
    }

    /** Change the short code of an owned link — authenticated users only. */
    @PatchMapping("/{code}/customize")
    public ResponseEntity<UrlResponse> customizeCode(
            @PathVariable String code,
            @Valid @RequestBody ChangeCodeRequest req,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(urlService.changeCode(code, req.getNewCode(), user));
    }

    // ─── Helper ──────────────────────────────────────────────────────────────

    private User resolveUser(Authentication auth) {
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof User u) {
            return u;
        }
        return null;
    }
}
