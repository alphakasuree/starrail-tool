package com.example.honkai.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
@Entity @Table(name="profile_session") @Getter @Setter @NoArgsConstructor
public class ProfileSession {

    @Id @Column(length=64) private String tokenHash;
    @Column(nullable=false) private Long profileId;
    @Column(nullable=false) private Instant expiresAt;
}
