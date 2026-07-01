package com.urlshortner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ChangeCodeRequest {

    @NotBlank(message = "New code is required")
    @Pattern(
        regexp = "^[a-zA-Z0-9_-]{3,30}$",
        message = "Code must be 3–30 alphanumeric characters (hyphens and underscores allowed)"
    )
    private String newCode;
}
