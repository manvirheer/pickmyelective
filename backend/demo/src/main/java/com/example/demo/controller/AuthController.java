package com.example.demo.controller;

import com.example.demo.service.AuthService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    // Constructor Injection
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // Endpoint 1: Request OTP
    // POST http://localhost:8080/auth/login
    // Body: { "email": "student@sfu.ca" }
    @PostMapping("/login")
    public String login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        try {
            return authService.sendOtp(email);
        } catch (IllegalArgumentException e) {
            return "Error: " + e.getMessage();
        }
    }

    // Endpoint 2: Verify OTP
    // POST http://localhost:8080/auth/verify
    // Body: { "email": "student@sfu.ca", "otp": "123456" }
    @PostMapping("/verify")
    public String verify(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");

        boolean isValid = authService.verifyOtp(email, otp);

        if (isValid) {
            return "Authentication Successful! Welcome.";
        } else {
            return "Invalid or Expired OTP.";
        }
    }
}