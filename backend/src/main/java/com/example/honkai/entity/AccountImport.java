package com.example.honkai.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
@Entity @Table(name="account_import") @Getter @Setter @NoArgsConstructor
public class AccountImport {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private Long profileId;
    @Column(nullable=false, length=64) private String payloadHash;
    @Column(nullable=false) private Instant createdAt;
}
