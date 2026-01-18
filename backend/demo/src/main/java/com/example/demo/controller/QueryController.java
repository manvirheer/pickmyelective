package com.example.demo.controller;

import com.example.demo.dto.QueryHistoryResponse;
import com.example.demo.dto.QueryLimitResponse;
import com.example.demo.dto.QueryRequest;
import com.example.demo.dto.QueryResponse;
import com.example.demo.model.User;
import com.example.demo.service.AuthService;
import com.example.demo.service.QueryService;
import com.example.demo.security.JwtUtil;
import com.example.demo.validation.QueryValidator;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/query")
public class QueryController {

    private final QueryService queryService;
    private final AuthService authService;
    private final JwtUtil jwtUtil;
    private final QueryValidator queryValidator;

    public QueryController(QueryService queryService, AuthService authService, JwtUtil jwtUtil, QueryValidator queryValidator) {
        this.queryService = queryService;
        this.authService = authService;
        this.jwtUtil = jwtUtil;
        this.queryValidator = queryValidator;
    }

    // Submit a query
    // POST /api/query
    // Header: Authorization: Bearer <token>
    // Body: { "query": "best electives for CS" }
    @PostMapping
    public ResponseEntity<?> submitQuery(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody QueryRequest request) {

        User user = validateTokenAndGetUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid or expired token"));
        }

        // Validate and sanitize query input
        try {
            queryValidator.validate(request.getQuery());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }

        String sanitizedQuery = queryValidator.sanitize(request.getQuery());

        QueryResponse response = queryService.processQuery(user, sanitizedQuery, request.getFilters());

        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(response);
        }

        return ResponseEntity.ok(response);
    }

    // Get remaining query limit
    // GET /api/query/limit
    // Header: Authorization: Bearer <token>
    @GetMapping("/limit")
    public ResponseEntity<?> getQueryLimit(@RequestHeader("Authorization") String authHeader) {
        User user = validateTokenAndGetUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid or expired token"));
        }

        QueryLimitResponse response = queryService.getQueryLimit(user);
        return ResponseEntity.ok(response);
    }

    // Get query history
    // GET /api/query/history
    // Header: Authorization: Bearer <token>
    @GetMapping("/history")
    public ResponseEntity<?> getQueryHistory(@RequestHeader("Authorization") String authHeader) {
        User user = validateTokenAndGetUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid or expired token"));
        }

        List<QueryHistoryResponse> history = queryService.getQueryHistory(user);
        return ResponseEntity.ok(history);
    }

    private User validateTokenAndGetUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        String token = authHeader.substring(7);

        if (!jwtUtil.validateToken(token)) {
            return null;
        }

        String email = jwtUtil.extractEmail(token);
        return authService.getUserByEmail(email);
    }
}
