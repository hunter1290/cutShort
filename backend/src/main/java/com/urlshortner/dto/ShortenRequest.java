package com.urlshortner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.hibernate.validator.constraints.URL;

import java.time.LocalDateTime;

@Data
public class ShortenRequest {

    @URL(message = "Must be a valid URL")
    @NotBlank(message = "URL is required")
    private String originalUrl;

    // Authenticated users only — ignored for anonymous callers
    @Pattern(
        regexp = "^[a-zA-Z0-9_-]{3,30}$",
        message = "Custom code must be 3–30 alphanumeric characters (hyphens and underscores allowed)"
    )
    private String customCode;

    // Authenticated users only — ignored for anonymous callers
    private LocalDateTime expiresAt;
}
