package com.example.demo.repository;

import com.example.demo.model.QueryHistory;
import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QueryHistoryRepository extends JpaRepository<QueryHistory, UUID> {
    List<QueryHistory> findByUserOrderByCreatedAtDesc(User user);
    List<QueryHistory> findTop10ByUserOrderByCreatedAtDesc(User user);
}
