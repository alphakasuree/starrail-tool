package com.example.honkai.repository;
import com.example.honkai.entity.AccountImport;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ImportRepository extends JpaRepository<AccountImport,Long> {
    boolean existsByProfileIdAndPayloadHash(Long profileId,String hash);
}
