package com.example.honkai.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
@Entity @Table(name="warp_banner") @Getter @Setter @NoArgsConstructor
public class WarpBanner {

    @Id @Column(length=64) private String bannerKey;
    @Column(nullable=false, length=150) private String title;
    @Column(nullable=false, length=40) private String pityGroup;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="featured_item_key") private WarpItem featuredItem;
    @Column(nullable=false) private boolean featuredFour;
    @Column(nullable=false) private boolean enabled;
}
