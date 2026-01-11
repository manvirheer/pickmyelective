package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

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

    private QueryFilters filters;

    public RagRequest() {
        this.topK = 5;
        this.minRelevance = 0.30;
    }

    public RagRequest(String query) {
        this.query = query;
        this.topK = 5;
        this.minRelevance = 0.30;
    }

    public RagRequest(String query, QueryFilters filters) {
        this.query = query;
        this.filters = filters;
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

    public QueryFilters getFilters() {
        return filters;
    }

    public void setFilters(QueryFilters filters) {
        this.filters = filters;
    }

    /**
     * Nested class for query filters.
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class QueryFilters {

        private List<String> campus;

        private List<String> wqb;

        @JsonProperty("max_level")
        private Integer maxLevel;

        @JsonProperty("no_prerequisites")
        private Boolean noPrerequisites;

        @JsonProperty("online_only")
        private Boolean onlineOnly;

        @JsonProperty("exclude_departments")
        private List<String> excludeDepartments;

        public QueryFilters() {}

        public List<String> getCampus() {
            return campus;
        }

        public void setCampus(List<String> campus) {
            this.campus = campus;
        }

        public List<String> getWqb() {
            return wqb;
        }

        public void setWqb(List<String> wqb) {
            this.wqb = wqb;
        }

        public Integer getMaxLevel() {
            return maxLevel;
        }

        public void setMaxLevel(Integer maxLevel) {
            this.maxLevel = maxLevel;
        }

        public Boolean getNoPrerequisites() {
            return noPrerequisites;
        }

        public void setNoPrerequisites(Boolean noPrerequisites) {
            this.noPrerequisites = noPrerequisites;
        }

        public Boolean getOnlineOnly() {
            return onlineOnly;
        }

        public void setOnlineOnly(Boolean onlineOnly) {
            this.onlineOnly = onlineOnly;
        }

        public List<String> getExcludeDepartments() {
            return excludeDepartments;
        }

        public void setExcludeDepartments(List<String> excludeDepartments) {
            this.excludeDepartments = excludeDepartments;
        }
    }
}
