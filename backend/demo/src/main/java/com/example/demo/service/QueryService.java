package com.example.demo.service;

import com.example.demo.dto.QueryHistoryResponse;
import com.example.demo.dto.QueryLimitResponse;
import com.example.demo.dto.QueryResponse;
import com.example.demo.dto.RagRequest;
import com.example.demo.dto.RagResponse;
import com.example.demo.model.QueryHistory;
import com.example.demo.model.QueryLimit;
import com.example.demo.model.User;
import com.example.demo.repository.QueryHistoryRepository;
import com.example.demo.repository.QueryLimitRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class QueryService {

    private static final Logger logger = LoggerFactory.getLogger(QueryService.class);

    private final QueryHistoryRepository queryHistoryRepository;
    private final QueryLimitRepository queryLimitRepository;
    private final RestTemplate restTemplate;

    @Value("${rag.service.url}")
    private String ragServiceUrl;

    public QueryService(QueryHistoryRepository queryHistoryRepository,
                        QueryLimitRepository queryLimitRepository) {
        this.queryHistoryRepository = queryHistoryRepository;
        this.queryLimitRepository = queryLimitRepository;
        this.restTemplate = new RestTemplate();
    }

    @Transactional
    public QueryResponse processQuery(User user, String queryText, RagRequest.QueryFilters filters) {
        // Use pessimistic locking to prevent race conditions
        QueryLimit queryLimit = getOrCreateQueryLimitWithLock(user);

        // Check if window has expired and reset if needed
        if (queryLimit.isWindowExpired()) {
            queryLimit.resetWindow();
        }

        // Check rate limit
        if (!queryLimit.canQuery()) {
            logger.warn("Query limit exceeded for user: {}", user.getEmail());
            return QueryResponse.error(
                "Query limit exceeded. Maximum " + QueryLimit.getMaxQueries() + " queries per " + QueryLimit.getWindowHours() + " hours.",
                0,
                queryLimit.getWindowResetTime()
            );
        }

        // Process the query with RAG service
        RagResponse ragResponse = processQueryWithRAG(queryText, filters);

        // Format response text for history storage
        String responseText = formatRagResponse(ragResponse);

        // Save query history
        QueryHistory history = new QueryHistory(user, queryText, responseText);
        queryHistoryRepository.save(history);

        // Increment query count
        queryLimit.incrementCount();
        queryLimitRepository.save(queryLimit);

        logger.info("Query processed for user: {}, remaining queries: {}", user.getEmail(), queryLimit.getRemainingQueries());

        // Return structured response
        if (ragResponse == null || !ragResponse.isSuccess()) {
            return new QueryResponse(
                queryText,
                ragResponse != null ? ragResponse.getQueryInterpretation() : null,
                List.of(),
                queryLimit.getRemainingQueries(),
                queryLimit.getWindowResetTime()
            );
        }

        return new QueryResponse(
            queryText,
            ragResponse.getQueryInterpretation(),
            ragResponse.getCourses() != null ? ragResponse.getCourses() : List.of(),
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
            QueryLimit.getMaxQueries(),
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

    /**
     * Gets or creates QueryLimit with pessimistic lock for atomic operations.
     */
    @Transactional
    public QueryLimit getOrCreateQueryLimitWithLock(User user) {
        return queryLimitRepository.findByUserWithLock(user)
            .orElseGet(() -> {
                QueryLimit newLimit = new QueryLimit(user);
                return queryLimitRepository.save(newLimit);
            });
    }

    /**
     * Gets or creates QueryLimit without lock (for read-only operations).
     */
    @Transactional
    public QueryLimit getOrCreateQueryLimit(User user) {
        return queryLimitRepository.findByUser(user)
            .orElseGet(() -> {
                QueryLimit newLimit = new QueryLimit(user);
                return queryLimitRepository.save(newLimit);
            });
    }

    /**
     * Calls the RAG service to get course recommendations.
     */
    private RagResponse processQueryWithRAG(String queryText, RagRequest.QueryFilters filters) {
        try {
            RagRequest request = new RagRequest(queryText, filters);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<RagRequest> entity = new HttpEntity<>(request, headers);

            RagResponse response = restTemplate.postForObject(
                ragServiceUrl + "/api/recommend",
                entity,
                RagResponse.class
            );

            if (response == null) {
                logger.error("RAG service returned null response");
                RagResponse errorResponse = new RagResponse();
                errorResponse.setSuccess(false);
                errorResponse.setError("Unable to process your query. Please try again later.");
                return errorResponse;
            }

            if (!response.isSuccess()) {
                logger.error("RAG service returned error: {}", response.getError());
            }

            return response;

        } catch (RestClientException e) {
            logger.error("Failed to connect to RAG service: {}", e.getMessage(), e);
            RagResponse errorResponse = new RagResponse();
            errorResponse.setSuccess(false);
            errorResponse.setError("Course recommendation service is temporarily unavailable. Please try again later.");
            return errorResponse;
        } catch (Exception e) {
            logger.error("Unexpected error calling RAG service: {}", e.getMessage(), e);
            RagResponse errorResponse = new RagResponse();
            errorResponse.setSuccess(false);
            errorResponse.setError("An unexpected error occurred. Please try again later.");
            return errorResponse;
        }
    }

    /**
     * Formats the RAG response into a readable string.
     */
    private String formatRagResponse(RagResponse response) {
        StringBuilder sb = new StringBuilder();

        // Add query interpretation
        if (response.getQueryInterpretation() != null && !response.getQueryInterpretation().isEmpty()) {
            sb.append("**Understanding your query:** ").append(response.getQueryInterpretation()).append("\n\n");
        }

        // Add course recommendations
        List<RagResponse.CourseResult> courses = response.getCourses();
        if (courses == null || courses.isEmpty()) {
            sb.append("No courses found matching your criteria. Try broadening your search.");
            return sb.toString();
        }

        sb.append("**Recommended Courses:**\n\n");

        for (int i = 0; i < courses.size(); i++) {
            RagResponse.CourseResult course = courses.get(i);
            sb.append(String.format("%d. %s\n\n", i + 1, course.toFormattedString()));
        }

        return sb.toString();
    }
}
