package com.urlshortner.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class ExtendExpiryRequest {

    @Min(value = 1, message = "Must extend by at least 1 day")
    @Max(value = 365, message = "Cannot extend by more than 365 days at once")
    private int days;
}
