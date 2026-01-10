package com.example.demo.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;

import io.github.cdimascio.dotenv.Dotenv;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private final Dotenv dotenv = Dotenv.configure()
            .ignoreIfMissing()
            .load();
    
    // 2. Read the key (No more hardcoding!)
    private final String RESEND_API_KEY = dotenv.get("RESEND_API_KEY");
    
    
    // In-memory storage for OTPs (For production, use Redis or a Database)
    private final Map<String, String> otpStorage = new HashMap<>();

    public String sendOtp(String email) {
        // 1. Validate SFU Email
        if (!email.trim().toLowerCase().endsWith("@sfu.ca")) {
            throw new IllegalArgumentException("Only @sfu.ca emails are allowed.");
        }

        // 2. Generate 6-digit OTP
        String otp = generateOtp();

        // 3. Store OTP (Email -> OTP)
        otpStorage.put(email, otp);

        // 4. Send Email using Resend
        Resend resend = new Resend(RESEND_API_KEY);

        CreateEmailOptions params = CreateEmailOptions.builder()
                .from("Auth Service <onboarding@resend.dev>") // Use your verified domain here
                .to(email)
                .subject("Your SFU Verification Code")
                .html("<strong>Your login code is: " + otp + "</strong>")
                .build();

        try {
            CreateEmailResponse data = resend.emails().send(params);
            return "OTP sent successfully. ID: " + data.getId();
        } catch (ResendException e) {
            e.printStackTrace();
            return "Error sending email.";
        }
    }

    public boolean verifyOtp(String email, String otpToVerify) {
        String storedOtp = otpStorage.get(email);
        
        if (storedOtp != null && storedOtp.equals(otpToVerify)) {
            otpStorage.remove(email); // One-time use: clear after success
            return true;
        }
        return false;
    }

    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int otp = 100000 + random.nextInt(900000); // Generates 100000 to 999999
        return String.valueOf(otp);
    }
}