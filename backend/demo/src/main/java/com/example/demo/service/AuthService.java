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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final OtpRepository otpRepository;
    private final UserRepository userRepository;
    private final QueryLimitRepository queryLimitRepository;
    private final JwtUtil jwtUtil;

    @Value("${resend.api-key}")
    private String resendApiKey;

    @Value("${resend.from-email}")
    private String fromEmail;

    @Value("${auth.allowed-email-domain}")
    private String allowedEmailDomain;

    public AuthService(OtpRepository otpRepository,
                       UserRepository userRepository,
                       QueryLimitRepository queryLimitRepository,
                       JwtUtil jwtUtil) {
        this.otpRepository = otpRepository;
        this.userRepository = userRepository;
        this.queryLimitRepository = queryLimitRepository;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Main entry point - creates OTP and sends email.
     * Email sending is outside transaction to avoid holding DB connection during network call.
     */
    public String sendOtp(String email) {
        // Validate and create OTP (transactional)
        Otp otp = createOtpInTransaction(email);

        // Send email (non-transactional, network call)
        return sendOtpEmail(otp.getEmail(), otp.getOtpCode());
    }

    /**
     * Creates OTP in database - runs in transaction.
     */
    @Transactional
    protected Otp createOtpInTransaction(String email) {
        // 1. Validate email domain
        if (!email.trim().toLowerCase().endsWith(allowedEmailDomain)) {
            throw new IllegalArgumentException("Only " + allowedEmailDomain + " emails are allowed.");
        }

        String normalizedEmail = email.trim().toLowerCase();

        // 2. Invalidate any existing OTPs for this email
        otpRepository.invalidateAllOtpsForEmail(normalizedEmail);

        // 3. Generate 6-digit OTP
        String otpCode = generateOtp();

        // 4. Store OTP in database with expiration
        Otp otp = new Otp(normalizedEmail, otpCode);
        otpRepository.save(otp);

        logger.info("OTP created for email: {}", normalizedEmail);
        return otp;
    }

    /**
     * Sends OTP via email - runs outside transaction.
     */
    private String sendOtpEmail(String email, String otpCode) {
        Resend resend = new Resend(resendApiKey);

        CreateEmailOptions params = CreateEmailOptions.builder()
                .from(fromEmail)
                .to(email)
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
            logger.info("OTP email sent successfully to: {}, ID: {}", email, data.getId());
            return "OTP sent successfully. ID: " + data.getId();
        } catch (ResendException e) {
            logger.error("Failed to send OTP email to: {}. Error: {}", email, e.getMessage(), e);
            throw new RuntimeException("Failed to send verification email. Please try again later.");
        }
    }

    @Transactional
    public AuthResponse verifyOtp(String email, String otpToVerify) {
        String normalizedEmail = email.trim().toLowerCase();

        // 1. Find valid OTP
        Optional<Otp> otpOptional = otpRepository.findValidOtpByEmail(normalizedEmail, LocalDateTime.now());

        if (otpOptional.isEmpty()) {
            logger.warn("Invalid or expired OTP attempt for email: {}", normalizedEmail);
            return new AuthResponse(false, "Invalid or expired OTP.");
        }

        Otp otp = otpOptional.get();

        // 2. Verify OTP code
        if (!otp.getOtpCode().equals(otpToVerify)) {
            logger.warn("Incorrect OTP code entered for email: {}", normalizedEmail);
            return new AuthResponse(false, "Invalid OTP code.");
        }

        // 3. Mark OTP as used
        otp.setUsed(true);
        otpRepository.save(otp);

        // 4. Create or update user
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseGet(() -> {
                    User newUser = new User(normalizedEmail);
                    logger.info("New user created: {}", normalizedEmail);
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

        logger.info("User authenticated successfully: {}", normalizedEmail);
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
        logger.info("Expired OTPs cleaned up");
    }
}
