package com.example.demo.controller;

import com.example.demo.dto.AuthResponse;
import com.example.demo.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
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

        try {
            String result = authService.sendOtp(email);
            boolean success = result.contains("successfully");

            return ResponseEntity.ok(Map.of(
                "success", success,
                "message", result,
                "email", email.trim().toLowerCase()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
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
