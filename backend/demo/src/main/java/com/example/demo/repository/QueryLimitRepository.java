package com.example.demo.repository;

import com.example.demo.model.QueryLimit;
import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface QueryLimitRepository extends JpaRepository<QueryLimit, UUID> {
    Optional<QueryLimit> findByUser(User user);
}
