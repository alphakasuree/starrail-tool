package com.example.honkai.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
@Entity @Table(name="warp_pull_batch") @Getter @Setter @NoArgsConstructor
public class PullBatch {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private Long profileId;
    @Column(nullable=false, length=36) private String requestId;
    @Column(nullable=false, length=64) private String requestHash;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="banner_key") private WarpBanner banner;
    @Column(nullable=false) private int pullCount;
    @Column(nullable=false) private Instant createdAt;
    @Column(nullable=false) private int endPity4;
    @Column(nullable=false) private int endPity5;
    @Column(nullable=false) private boolean endGuaranteed4;
    @Column(nullable=false) private boolean endGuaranteed5;
    @Column(nullable=false) private long endRevision;
}
