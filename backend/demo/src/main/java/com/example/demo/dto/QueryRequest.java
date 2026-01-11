package com.example.demo.dto;

public class QueryRequest {
    private String query;
    private RagRequest.QueryFilters filters;

    public QueryRequest() {}

    public QueryRequest(String query) {
        this.query = query;
    }

    public QueryRequest(String query, RagRequest.QueryFilters filters) {
        this.query = query;
        this.filters = filters;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public RagRequest.QueryFilters getFilters() {
        return filters;
    }

    public void setFilters(RagRequest.QueryFilters filters) {
        this.filters = filters;
    }
}
