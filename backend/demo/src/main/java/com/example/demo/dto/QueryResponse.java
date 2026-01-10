package com.example.demo.dto;

import java.time.LocalDateTime;

public class QueryResponse {
    private String query;
    private String response;
    private int remainingQueries;
    private LocalDateTime resetTime;
    private boolean success;
    private String error;

    public QueryResponse() {}

    public QueryResponse(String query, String response, int remainingQueries, LocalDateTime resetTime) {
        this.query = query;
        this.response = response;
        this.remainingQueries = remainingQueries;
        this.resetTime = resetTime;
        this.success = true;
    }

    public static QueryResponse error(String errorMessage, int remainingQueries, LocalDateTime resetTime) {
        QueryResponse response = new QueryResponse();
        response.setSuccess(false);
        response.setError(errorMessage);
        response.setRemainingQueries(remainingQueries);
        response.setResetTime(resetTime);
        return response;
    }

    // Getters and Setters
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

    public int getRemainingQueries() {
        return remainingQueries;
    }

    public void setRemainingQueries(int remainingQueries) {
        this.remainingQueries = remainingQueries;
    }

    public LocalDateTime getResetTime() {
        return resetTime;
    }

    public void setResetTime(LocalDateTime resetTime) {
        this.resetTime = resetTime;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
