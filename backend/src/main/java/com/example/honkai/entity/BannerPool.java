package com.example.honkai.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
@Entity @Table(name="warp_banner_pool") @Getter @Setter @NoArgsConstructor
public class BannerPool {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false, length=64) private String bannerKey;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="item_key") private WarpItem item;
    @Column(nullable=false) private boolean featured;
}
