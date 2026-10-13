package com.toothfairy.patient_auth.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class PatientBookingResponse {
    private UUID   id;
    private String cabinetSlug;
    private String cabinetName;
    private String cabinetCity;
    private String cabinetSpecialties;
    private String dentistFirstName;
    private String dentistLastName;
    private String service;
    private Object price;            // BigDecimal or null
    private String date;             // YYYY-MM-DD
    private String time;             // HH:MM
    private int    durationMinutes;
    private String status;
    private boolean hasReview;
}
