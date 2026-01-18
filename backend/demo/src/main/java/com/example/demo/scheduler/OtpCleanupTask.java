package com.example.demo.scheduler;

import com.example.demo.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class OtpCleanupTask {

    private static final Logger logger = LoggerFactory.getLogger(OtpCleanupTask.class);

    private final AuthService authService;

    public OtpCleanupTask(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Cleanup expired OTPs every 30 minutes.
     * OTPs expire after 10 minutes, so running cleanup every 30 minutes
     * ensures they don't accumulate while not being too aggressive.
     */
    @Scheduled(fixedRate = 30 * 60 * 1000) // 30 minutes in milliseconds
    public void cleanupExpiredOtps() {
        logger.debug("Running scheduled OTP cleanup task");
        authService.cleanupExpiredOtps();
    }
}
