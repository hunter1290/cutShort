package com.urlshortner.controller;

import com.urlshortner.service.LatencyTrackingService;
import com.urlshortner.service.UrlService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequiredArgsConstructor
public class RedirectController {

    private final UrlService urlService;
    private final LatencyTrackingService latencyTrackingService;

    /**
     * Core redirect. Uses 302 (temporary) so browsers don't cache the destination —
     * this keeps click tracking accurate even if the target URL changes later.
     */
    @GetMapping("/{code}")
    public ResponseEntity<Void> redirect(@PathVariable String code) {
        long start = System.nanoTime();
        String destination = urlService.resolve(code);
        latencyTrackingService.record(code, (System.nanoTime() - start) / 1_000_000);

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(destination))
                .build();
    }
}
