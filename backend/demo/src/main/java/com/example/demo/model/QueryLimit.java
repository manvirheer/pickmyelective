package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "query_limits")
public class QueryLimit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(name = "query_count", nullable = false)
    private int queryCount = 0;

    @Column(name = "window_start", nullable = false)
    private LocalDateTime windowStart;

    public static final int MAX_QUERIES = 5;
    public static final int WINDOW_HOURS = 6;

    public static int getMaxQueries() {
        return MAX_QUERIES;
    }

    public static int getWindowHours() {
        return WINDOW_HOURS;
    }

    public QueryLimit() {
        this.queryCount = 0;
        this.windowStart = LocalDateTime.now();
    }

    public QueryLimit(User user) {
        this.user = user;
        this.queryCount = 0;
        this.windowStart = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public int getQueryCount() {
        return queryCount;
    }

    public void setQueryCount(int queryCount) {
        this.queryCount = queryCount;
    }

    public LocalDateTime getWindowStart() {
        return windowStart;
    }

    public void setWindowStart(LocalDateTime windowStart) {
        this.windowStart = windowStart;
    }

    // Business logic methods
    public boolean isWindowExpired() {
        return LocalDateTime.now().isAfter(windowStart.plusHours(WINDOW_HOURS));
    }

    public void resetWindow() {
        this.queryCount = 0;
        this.windowStart = LocalDateTime.now();
    }

    public boolean canQuery() {
        if (isWindowExpired()) {
            resetWindow();
        }
        return queryCount < MAX_QUERIES;
    }

    public void incrementCount() {
        if (isWindowExpired()) {
            resetWindow();
        }
        this.queryCount++;
    }

    public int getRemainingQueries() {
        if (isWindowExpired()) {
            return MAX_QUERIES;
        }
        return Math.max(0, MAX_QUERIES - queryCount);
    }

    public LocalDateTime getWindowResetTime() {
        return windowStart.plusHours(WINDOW_HOURS);
    }
}
