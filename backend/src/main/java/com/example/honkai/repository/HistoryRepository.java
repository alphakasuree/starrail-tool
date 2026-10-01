package com.example.honkai.repository;
import com.example.honkai.entity.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface HistoryRepository extends JpaRepository<WarpHistory, Long> {
    @Query("select h from WarpHistory h join fetch h.item join fetch h.batch b join fetch b.banner where b.id = :batchId order by h.pullIndex")
    List<WarpHistory> findBatch(@Param("batchId") Long batchId);
    @Query("select h from WarpHistory h join fetch h.item join fetch h.batch b join fetch b.banner where b.profileId = :profileId order by h.id")
    List<WarpHistory> findProgress(@Param("profileId") Long profileId);
}
