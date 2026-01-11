package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.List;

public class QueryResponse {
    private String query;

    @JsonProperty("query_interpretation")
    private String queryInterpretation;

    private List<RagResponse.CourseResult> courses;

    private int remainingQueries;
    private LocalDateTime resetTime;
    private boolean success;
    private String error;

    public QueryResponse() {}

    public QueryResponse(String query, String queryInterpretation, List<RagResponse.CourseResult> courses,
                         int remainingQueries, LocalDateTime resetTime) {
        this.query = query;
        this.queryInterpretation = queryInterpretation;
        this.courses = courses;
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

    public String getQueryInterpretation() {
        return queryInterpretation;
    }

    public void setQueryInterpretation(String queryInterpretation) {
        this.queryInterpretation = queryInterpretation;
    }

    public List<RagResponse.CourseResult> getCourses() {
        return courses;
    }

    public void setCourses(List<RagResponse.CourseResult> courses) {
        this.courses = courses;
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
