package com.urlshortner.gemini;

/** Thrown when Gemini is unconfigured or a call to it fails — always recoverable, never a user-facing error. */
public class GeminiUnavailableException extends RuntimeException {
    public GeminiUnavailableException(String message) {
        super(message);
    }
}
