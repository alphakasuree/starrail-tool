package com.example.honkai.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
@Entity @Table(name="warp_pity_state") @Getter @Setter @NoArgsConstructor
public class PityState {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private Long profileId;
    @Column(nullable=false, length=40) private String pityGroup;
    @Column(nullable=false) private int pity4;
    @Column(nullable=false) private int pity5;
    @Column(nullable=false) private boolean guaranteed4;
    @Column(nullable=false) private boolean guaranteed5;
    @Column(nullable=false) private long revision;
}
