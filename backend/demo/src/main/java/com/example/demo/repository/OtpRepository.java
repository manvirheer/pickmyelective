package com.example.demo.repository;

import com.example.demo.model.Otp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OtpRepository extends JpaRepository<Otp, UUID> {

    // Find the latest unused, non-expired OTP for an email
    @Query("SELECT o FROM Otp o WHERE o.email = :email AND o.used = false AND o.expiresAt > :now ORDER BY o.createdAt DESC")
    Optional<Otp> findValidOtpByEmail(String email, LocalDateTime now);

    // Delete all expired OTPs (cleanup)
    @Modifying
    @Transactional
    @Query("DELETE FROM Otp o WHERE o.expiresAt < :now")
    void deleteExpiredOtps(LocalDateTime now);

    // Invalidate all existing OTPs for an email (when sending a new one)
    @Modifying
    @Transactional
    @Query("UPDATE Otp o SET o.used = true WHERE o.email = :email AND o.used = false")
    void invalidateAllOtpsForEmail(String email);
}
