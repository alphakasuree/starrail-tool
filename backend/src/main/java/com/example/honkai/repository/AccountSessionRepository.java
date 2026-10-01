package com.example.honkai.repository;
import com.example.honkai.entity.AccountSession;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;
public interface AccountSessionRepository extends JpaRepository<AccountSession,String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from AccountSession s where s.tokenHash=:hash")
    Optional<AccountSession> lock(@Param("hash") String hash);
}
