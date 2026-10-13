package com.toothfairy.service;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.toothfairy.cabinet.Cabinet;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "treatment_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TreatmentType {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cabinet_id", nullable = false)
    private Cabinet cabinet;

    @Column(nullable = false)
    private String name;

    @Column(name = "duration_minutes")
    @Builder.Default
    private Integer durationMinutes = 30;

    private BigDecimal price;

    @Builder.Default
    private String color = "#2DD4BF";

    @Column(name = "is_consultation")
    @Builder.Default
    private Boolean isConsultation = false;

    @Column(name = "requires_consult_for_new")
    @Builder.Default
    private Boolean requiresConsultForNew = false;
}
