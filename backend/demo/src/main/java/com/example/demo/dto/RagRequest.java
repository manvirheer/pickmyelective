package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Request DTO for the RAG service /api/recommend endpoint.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RagRequest {

    private String query;

    @JsonProperty("top_k")
    private int topK;

    @JsonProperty("min_relevance")
    private double minRelevance;

    public RagRequest() {
        this.topK = 5;
        this.minRelevance = 0.30;
    }

    public RagRequest(String query) {
        this.query = query;
        this.topK = 5;
        this.minRelevance = 0.30;
    }

    // Getters and Setters
    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public int getTopK() {
        return topK;
    }

    public void setTopK(int topK) {
        this.topK = topK;
    }

    public double getMinRelevance() {
        return minRelevance;
    }

    public void setMinRelevance(double minRelevance) {
        this.minRelevance = minRelevance;
    }
}
