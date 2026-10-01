package com.example.honkai.repository;
import com.example.honkai.entity.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface ProfileRepository extends JpaRepository<Profile, Long> {
    Optional<Profile> findByLoginId(String loginId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Profile p where p.id = :id")
    Optional<Profile> lock(@Param("id") Long id);
}
