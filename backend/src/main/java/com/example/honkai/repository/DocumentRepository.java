package com.example.honkai.repository;
import com.example.honkai.entity.AccountDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface DocumentRepository extends JpaRepository<AccountDocument,Long> {
    Optional<AccountDocument> findByProfileIdAndSection(Long profileId,String section);
}
