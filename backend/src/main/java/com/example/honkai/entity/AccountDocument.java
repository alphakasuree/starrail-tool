package com.example.honkai.entity;
import jakarta.persistence.*;
import lombok.*;
@Entity @Table(name="account_document") @Getter @Setter @NoArgsConstructor
public class AccountDocument {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private Long profileId;
    @Column(nullable=false, length=20) private String section;
    @Column(nullable=false, columnDefinition="MEDIUMTEXT") private String payload;
    @Column(nullable=false) private long revision;
}
