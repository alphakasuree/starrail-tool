package com.example.honkai.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
@Entity @Table(name="warp_item") @Getter @Setter @NoArgsConstructor
public class WarpItem {

    @Id @Column(length=64) private String itemKey;
    @Column(nullable=false, length=30) private String catalogId;
    @Column(nullable=false, length=20) private String itemType;
    @Column(nullable=false, length=150) private String name;
    @Column(nullable=false) private int rarity;
}
