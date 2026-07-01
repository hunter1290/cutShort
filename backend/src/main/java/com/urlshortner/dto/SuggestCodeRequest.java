package com.urlshortner.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.hibernate.validator.constraints.URL;

@Data
public class SuggestCodeRequest {

    @URL(message = "Must be a valid URL")
    @NotBlank(message = "URL is required")
    private String originalUrl;
}
