package com.example.demo.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class QueryHistoryResponse {
    private UUID id;
    private String query;
    private String response;
    private LocalDateTime createdAt;

    public QueryHistoryResponse() {}

    public QueryHistoryResponse(UUID id, String query, String response, LocalDateTime createdAt) {
        this.id = id;
        this.query = query;
        this.response = response;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public String getResponse() {
        return response;
    }

    public void setResponse(String response) {
        this.response = response;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
