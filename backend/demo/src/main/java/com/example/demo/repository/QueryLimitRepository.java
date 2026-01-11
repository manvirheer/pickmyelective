package com.example.demo.repository;

import com.example.demo.model.QueryLimit;
import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QueryLimitRepository extends JpaRepository<QueryLimit, UUID> {

    Optional<QueryLimit> findByUser(User user);

    /**
     * Finds QueryLimit with pessimistic write lock to prevent race conditions.
     * Use this when checking and incrementing query count atomically.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT q FROM QueryLimit q WHERE q.user = :user")
    Optional<QueryLimit> findByUserWithLock(@Param("user") User user);
}
