package com.example.honkai.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
@Entity @Table(name="app_profile") @Getter @Setter @NoArgsConstructor
public class Profile {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false, unique=true, length=36) private String publicId;
    @Column(nullable=false, length=30) private String displayName;
    @Column(unique=true, length=30) private String loginId;
    @Column(length=100) private String passwordHash;
    @Column(nullable=false) private Instant createdAt;
    @Column(nullable=false, length=64) private String selectedCharacter = "1503";
    @Column(nullable=false, length=64) private String selectedLightcone = "23055";
}
