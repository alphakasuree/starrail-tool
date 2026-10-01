package com.example.honkai.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
@Entity @Table(name="warp_history") @Getter @Setter @NoArgsConstructor
public class WarpHistory {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="batch_id") private PullBatch batch;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="item_key") private WarpItem item;
    @Column(nullable=false) private int pullIndex;
    @Column(nullable=false) private boolean featured;
    @Column(nullable=false) private Instant pulledAt;
}
