package com.example.honkai.repository;
import com.example.honkai.entity.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface BatchRepository extends JpaRepository<PullBatch, Long> {
    Optional<PullBatch> findByProfileIdAndRequestId(Long profileId, String requestId);
}
