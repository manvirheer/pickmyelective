package com.example.demo.validation;

import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
public class QueryValidator {

    private static final int MAX_QUERY_LENGTH = 500;
    private static final Pattern CONTROL_CHARS =
        Pattern.compile("[\\p{Cntrl}&&[^\n\t]]");

    public String sanitize(String query) {
        if (query == null) return null;

        String sanitized = query.trim();

        // Length limit
        if (sanitized.length() > MAX_QUERY_LENGTH) {
            sanitized = sanitized.substring(0, MAX_QUERY_LENGTH);
        }

        // Remove control characters
        sanitized = CONTROL_CHARS.matcher(sanitized).replaceAll("");

        // Normalize whitespace
        sanitized = sanitized.replaceAll("\\s+", " ");

        return sanitized.trim();
    }

    public void validate(String query) {
        if (query == null || query.isBlank()) {
            throw new IllegalArgumentException("Query is required");
        }
        if (query.length() > MAX_QUERY_LENGTH) {
            throw new IllegalArgumentException(
                "Query exceeds maximum length of " + MAX_QUERY_LENGTH);
        }
    }
}
