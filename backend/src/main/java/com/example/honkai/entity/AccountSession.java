package com.example.honkai.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
@Entity @Table(name="account_session") @Getter @Setter @NoArgsConstructor
public class AccountSession {
    @Id @Column(length=64) private String tokenHash;
    @Column(nullable=false) private Long profileId;
    @Column(nullable=false) private Instant createdAt;
    @Column(nullable=false) private Instant expiresAt;
    @Column(nullable=false) private Instant absoluteExpiresAt;
}
