package com.example.demo.dto;

import java.time.LocalDateTime;

public class QueryLimitResponse {
    private int remainingQueries;
    private int maxQueries;
    private LocalDateTime resetTime;

    public QueryLimitResponse() {}

    public QueryLimitResponse(int remainingQueries, int maxQueries, LocalDateTime resetTime) {
        this.remainingQueries = remainingQueries;
        this.maxQueries = maxQueries;
        this.resetTime = resetTime;
    }

    public int getRemainingQueries() {
        return remainingQueries;
    }

    public void setRemainingQueries(int remainingQueries) {
        this.remainingQueries = remainingQueries;
    }

    public int getMaxQueries() {
        return maxQueries;
    }

    public void setMaxQueries(int maxQueries) {
        this.maxQueries = maxQueries;
    }

    public LocalDateTime getResetTime() {
        return resetTime;
    }

    public void setResetTime(LocalDateTime resetTime) {
        this.resetTime = resetTime;
    }
}
