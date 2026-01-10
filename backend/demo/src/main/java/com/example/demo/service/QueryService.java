package com.example.demo.service;

import com.example.demo.dto.QueryHistoryResponse;
import com.example.demo.dto.QueryLimitResponse;
import com.example.demo.dto.QueryResponse;
import com.example.demo.model.QueryHistory;
import com.example.demo.model.QueryLimit;
import com.example.demo.model.User;
import com.example.demo.repository.QueryHistoryRepository;
import com.example.demo.repository.QueryLimitRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class QueryService {

    private static final int MAX_QUERIES = 5;
    private static final int WINDOW_HOURS = 6;

    private final QueryHistoryRepository queryHistoryRepository;
    private final QueryLimitRepository queryLimitRepository;

    public QueryService(QueryHistoryRepository queryHistoryRepository,
                        QueryLimitRepository queryLimitRepository) {
        this.queryHistoryRepository = queryHistoryRepository;
        this.queryLimitRepository = queryLimitRepository;
    }

    @Transactional
    public QueryResponse processQuery(User user, String queryText) {
        QueryLimit queryLimit = getOrCreateQueryLimit(user);

        // Check if window has expired and reset if needed
        if (queryLimit.isWindowExpired()) {
            queryLimit.resetWindow();
            queryLimitRepository.save(queryLimit);
        }

        // Check rate limit
        if (!queryLimit.canQuery()) {
            return QueryResponse.error(
                "Query limit exceeded. Maximum " + MAX_QUERIES + " queries per " + WINDOW_HOURS + " hours.",
                0,
                queryLimit.getWindowResetTime()
            );
        }

        // Process the query (placeholder - integrate with your AI service)
        String responseText = processQueryWithAI(queryText);

        // Save query history
        QueryHistory history = new QueryHistory(user, queryText, responseText);
        queryHistoryRepository.save(history);

        // Increment query count
        queryLimit.incrementCount();
        queryLimitRepository.save(queryLimit);

        return new QueryResponse(
            queryText,
            responseText,
            queryLimit.getRemainingQueries(),
            queryLimit.getWindowResetTime()
        );
    }

    public QueryLimitResponse getQueryLimit(User user) {
        QueryLimit queryLimit = getOrCreateQueryLimit(user);

        // Check if window has expired and reset if needed
        if (queryLimit.isWindowExpired()) {
            queryLimit.resetWindow();
            queryLimitRepository.save(queryLimit);
        }

        return new QueryLimitResponse(
            queryLimit.getRemainingQueries(),
            MAX_QUERIES,
            queryLimit.getWindowResetTime()
        );
    }

    public List<QueryHistoryResponse> getQueryHistory(User user) {
        List<QueryHistory> history = queryHistoryRepository.findTop10ByUserOrderByCreatedAtDesc(user);

        return history.stream()
            .map(h -> new QueryHistoryResponse(
                h.getId(),
                h.getQueryText(),
                h.getResponseText(),
                h.getCreatedAt()
            ))
            .collect(Collectors.toList());
    }

    @Transactional
    public QueryLimit getOrCreateQueryLimit(User user) {
        return queryLimitRepository.findByUser(user)
            .orElseGet(() -> {
                QueryLimit newLimit = new QueryLimit(user);
                return queryLimitRepository.save(newLimit);
            });
    }

    private String processQueryWithAI(String queryText) {
        // Placeholder for AI integration
        // TODO: Integrate with your AI service (OpenAI, Claude, etc.)
        return "This is a placeholder response for query: " + queryText +
               ". Integrate with your AI service for actual recommendations.";
    }
}
