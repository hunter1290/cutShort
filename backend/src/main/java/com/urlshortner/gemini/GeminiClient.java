package com.urlshortner.gemini;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

/** Thin wrapper around the Gemini generateContent REST API. */
@Component
public class GeminiClient {

    private final RestClient restClient;
    private final String apiKey;
    private final String model;

    public GeminiClient(
            @Value("${app.gemini.base-url}") String baseUrl,
            @Value("${app.gemini.api-key:}") String apiKey,
            @Value("${app.gemini.model}") String model
    ) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(5_000);
        requestFactory.setReadTimeout(15_000);

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
        this.apiKey = apiKey;
        this.model = model;
    }

    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * @param jsonMode when true, instructs Gemini to return raw JSON (no markdown fences) —
     *                 used by callers that parse the response as structured data.
     */
    public String generateContent(String prompt, boolean jsonMode) {
        if (!isEnabled()) {
            throw new GeminiUnavailableException("Gemini API key is not configured");
        }

        Map<String, Object> generationConfig = jsonMode
                ? Map.of("responseMimeType", "application/json")
                : Map.of();

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", generationConfig
        );

        JsonNode response;
        try {
            response = restClient.post()
                    .uri("/models/{model}:generateContent", model)
                    .header("X-goog-api-key", apiKey)
                    .body(requestBody)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            throw new GeminiUnavailableException("Gemini request failed: " + e.getMessage());
        }

        JsonNode textNode = response
                .path("candidates").path(0)
                .path("content").path("parts").path(0)
                .path("text");

        if (textNode.isMissingNode()) {
            throw new GeminiUnavailableException("Gemini returned an unexpected response shape");
        }
        return textNode.asText();
    }
}
