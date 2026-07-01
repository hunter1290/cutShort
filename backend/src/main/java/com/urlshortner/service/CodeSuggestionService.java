package com.urlshortner.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.urlshortner.gemini.GeminiClient;
import com.urlshortner.gemini.GeminiUnavailableException;
import com.urlshortner.repository.UrlRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class CodeSuggestionService {

    private static final Pattern VALID_CODE = Pattern.compile("^[a-z0-9-]{3,30}$");
    private static final int MAX_SUGGESTIONS = 3;

    private final GeminiClient geminiClient;
    private final UrlRepository urlRepository;
    private final ObjectMapper objectMapper;

    /** Returns up to {@value #MAX_SUGGESTIONS} available, memorable short codes for the given URL. */
    public List<String> suggest(String originalUrl) {
        if (!geminiClient.isEnabled()) {
            return List.of();
        }

        try {
            String json = geminiClient.generateContent(buildPrompt(originalUrl), true);
            String[] rawSuggestions = objectMapper.readValue(json, String[].class);

            return List.of(rawSuggestions).stream()
                    .filter(s -> s != null)
                    .map(String::toLowerCase)
                    .filter(s -> VALID_CODE.matcher(s).matches())
                    .filter(s -> !urlRepository.existsByShortCode(s))
                    .distinct()
                    .limit(MAX_SUGGESTIONS)
                    .toList();
        } catch (GeminiUnavailableException | JsonProcessingException e) {
            return List.of();
        }
    }

    private String buildPrompt(String originalUrl) {
        return """
                Suggest %d short, memorable, URL-safe slugs for a link shortener,
                based on this destination URL: %s

                Rules:
                - lowercase letters, numbers, and hyphens only
                - 4 to 15 characters each
                - reflect the site or page topic, not generic words like "link" or "click"
                - respond with ONLY a JSON array of strings, e.g. ["slug-one","slug-two","slug-three"]
                """.formatted(MAX_SUGGESTIONS, originalUrl);
    }
}
