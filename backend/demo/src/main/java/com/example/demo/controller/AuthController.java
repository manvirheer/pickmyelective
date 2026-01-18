package com.example.demo.controller;

import com.example.demo.dto.AuthResponse;
import com.example.demo.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    // Rate limiting: max 5 OTP requests per email per 15 minutes
    private static final int MAX_REQUESTS_PER_WINDOW = 5;
    private static final long WINDOW_MILLIS = 15 * 60 * 1000; // 15 minutes
    private final Map<String, RateLimitEntry> emailRateLimits = new ConcurrentHashMap<>();

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    private static class RateLimitEntry {
        private int count;
        private long windowStart;

        RateLimitEntry() {
            this.count = 1;
            this.windowStart = System.currentTimeMillis();
        }

        synchronized void increment() {
            long now = System.currentTimeMillis();
            if (now - windowStart > WINDOW_MILLIS) {
                // Window expired, reset
                this.count = 1;
                this.windowStart = now;
            } else {
                this.count++;
            }
        }

        synchronized boolean isLimited() {
            long now = System.currentTimeMillis();
            if (now - windowStart > WINDOW_MILLIS) {
                return false; // Window expired
            }
            return count > MAX_REQUESTS_PER_WINDOW;
        }
    }

    // Endpoint 1: Request OTP
    // POST http://localhost:8080/auth/login
    // Body: { "email": "student@sfu.ca" }
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Email is required"
            ));
        }

        String normalizedEmail = email.trim().toLowerCase();

        // Check rate limit
        RateLimitEntry entry = emailRateLimits.get(normalizedEmail);
        if (entry != null && entry.isLimited()) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                "success", false,
                "message", "Too many OTP requests. Please wait 15 minutes before trying again."
            ));
        }

        // Track request
        emailRateLimits.compute(normalizedEmail, (k, v) -> {
            if (v == null) return new RateLimitEntry();
            v.increment();
            return v;
        });

        try {
            String result = authService.sendOtp(email);
            boolean success = result.contains("successfully");

            return ResponseEntity.ok(Map.of(
                "success", success,
                "message", result,
                "email", normalizedEmail
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // Endpoint 2: Verify OTP
    // POST http://localhost:8080/auth/verify
    // Body: { "email": "student@sfu.ca", "otp": "123456" }
    @PostMapping("/verify")
    public ResponseEntity<AuthResponse> verify(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new AuthResponse(false, "Email is required"));
        }

        if (otp == null || otp.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new AuthResponse(false, "OTP is required"));
        }

        AuthResponse response = authService.verifyOtp(email, otp);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}
