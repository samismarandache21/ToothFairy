package com.toothfairy.patient_auth.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class PatientAuthResponse {
    private String token;
    private PatientInfo patient;

    @Getter
    @Builder
    public static class PatientInfo {
        private UUID   id;
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
    }
}
