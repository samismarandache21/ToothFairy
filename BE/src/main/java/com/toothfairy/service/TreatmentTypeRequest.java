package com.toothfairy.service;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class TreatmentTypeRequest {

    @NotBlank(message = "Numele serviciului este obligatoriu")
    private String name;

    private Integer durationMinutes;
    private BigDecimal price;
    private String color;
    private Boolean isConsultation;
    private Boolean requiresConsultForNew;
}
