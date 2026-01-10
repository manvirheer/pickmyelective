package com.example.demo.service;

import com.example.demo.dto.AuthResponse;
import com.example.demo.model.Otp;
import com.example.demo.model.QueryLimit;
import com.example.demo.model.User;
import com.example.demo.repository.OtpRepository;
import com.example.demo.repository.QueryLimitRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;
import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;

import io.github.cdimascio.dotenv.Dotenv;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AuthService {

    private final Dotenv dotenv = Dotenv.configure()
            .ignoreIfMissing()
            .load();

    private final String RESEND_API_KEY = dotenv.get("RESEND_API_KEY");

    private final OtpRepository otpRepository;
    private final UserRepository userRepository;
    private final QueryLimitRepository queryLimitRepository;
    private final JwtUtil jwtUtil;

    public AuthService(OtpRepository otpRepository,
                       UserRepository userRepository,
                       QueryLimitRepository queryLimitRepository,
                       JwtUtil jwtUtil) {
        this.otpRepository = otpRepository;
        this.userRepository = userRepository;
        this.queryLimitRepository = queryLimitRepository;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public String sendOtp(String email) {
        // 1. Validate SFU Email
        if (!email.trim().toLowerCase().endsWith("@sfu.ca")) {
            throw new IllegalArgumentException("Only @sfu.ca emails are allowed.");
        }

        String normalizedEmail = email.trim().toLowerCase();

        // 2. Invalidate any existing OTPs for this email
        otpRepository.invalidateAllOtpsForEmail(normalizedEmail);

        // 3. Generate 6-digit OTP
        String otpCode = generateOtp();

        // 4. Store OTP in database with expiration
        Otp otp = new Otp(normalizedEmail, otpCode);
        otpRepository.save(otp);

        // 5. Send Email using Resend
        Resend resend = new Resend(RESEND_API_KEY);

        CreateEmailOptions params = CreateEmailOptions.builder()
                .from("Auth Service <onboarding@resend.dev>")
                .to(normalizedEmail)
                .subject("Your SFU Verification Code")
                .html("<div style='font-family: Arial, sans-serif; padding: 20px;'>" +
                      "<h2>PickMyElective Verification</h2>" +
                      "<p>Your verification code is:</p>" +
                      "<h1 style='color: #4CAF50; font-size: 32px;'>" + otpCode + "</h1>" +
                      "<p>This code expires in 10 minutes.</p>" +
                      "<p style='color: #666;'>If you didn't request this code, please ignore this email.</p>" +
                      "</div>")
                .build();

        try {
            CreateEmailResponse data = resend.emails().send(params);
            return "OTP sent successfully. ID: " + data.getId();
        } catch (ResendException e) {
            e.printStackTrace();
            return "Error sending email.";
        }
    }

    @Transactional
    public AuthResponse verifyOtp(String email, String otpToVerify) {
        String normalizedEmail = email.trim().toLowerCase();

        // 1. Find valid OTP
        Optional<Otp> otpOptional = otpRepository.findValidOtpByEmail(normalizedEmail, LocalDateTime.now());

        if (otpOptional.isEmpty()) {
            return new AuthResponse(false, "Invalid or expired OTP.");
        }

        Otp otp = otpOptional.get();

        // 2. Verify OTP code
        if (!otp.getOtpCode().equals(otpToVerify)) {
            return new AuthResponse(false, "Invalid OTP code.");
        }

        // 3. Mark OTP as used
        otp.setUsed(true);
        otpRepository.save(otp);

        // 4. Create or update user
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseGet(() -> {
                    User newUser = new User(normalizedEmail);
                    return userRepository.save(newUser);
                });

        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // 5. Initialize query limit if not exists
        if (queryLimitRepository.findByUser(user).isEmpty()) {
            QueryLimit queryLimit = new QueryLimit(user);
            queryLimitRepository.save(queryLimit);
        }

        // 6. Generate JWT token
        String token = jwtUtil.generateToken(normalizedEmail);
        long expiresIn = jwtUtil.getExpirationInSeconds();

        return new AuthResponse(token, normalizedEmail, expiresIn);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    // Cleanup expired OTPs (can be called by a scheduled task)
    @Transactional
    public void cleanupExpiredOtps() {
        otpRepository.deleteExpiredOtps(LocalDateTime.now());
    }
}
