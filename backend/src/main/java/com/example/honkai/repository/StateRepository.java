package com.example.honkai.repository;
import com.example.honkai.entity.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface StateRepository extends JpaRepository<PityState, Long> {
    Optional<PityState> findByProfileIdAndPityGroup(Long profileId, String pityGroup);
    List<PityState> findByProfileId(Long profileId);
}
