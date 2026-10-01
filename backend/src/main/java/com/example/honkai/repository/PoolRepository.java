package com.example.honkai.repository;
import com.example.honkai.entity.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface PoolRepository extends JpaRepository<BannerPool, Long> {
    @Query("select p from BannerPool p join fetch p.item where p.bannerKey = :key")
    List<BannerPool> findPool(@Param("key") String key);
}
