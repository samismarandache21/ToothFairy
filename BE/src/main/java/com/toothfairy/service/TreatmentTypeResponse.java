package com.toothfairy.service;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO pentru răspunsuri TreatmentType — NU include relația cabinet.
 */
@Getter
@Builder
public class TreatmentTypeResponse {

    private UUID       id;
    private String     name;
    private Integer    durationMinutes;
    private BigDecimal price;
    private String     color;
    private Boolean    isConsultation;
    private Boolean    requiresConsultForNew;

    public static TreatmentTypeResponse from(TreatmentType t) {
        return TreatmentTypeResponse.builder()
                .id(t.getId())
                .name(t.getName())
                .durationMinutes(t.getDurationMinutes() != null ? t.getDurationMinutes() : 30)
                .price(t.getPrice())
                .color(t.getColor())
                .isConsultation(t.getIsConsultation() != null && t.getIsConsultation())
                .requiresConsultForNew(t.getRequiresConsultForNew() != null && t.getRequiresConsultForNew())
                .build();
    }
}
