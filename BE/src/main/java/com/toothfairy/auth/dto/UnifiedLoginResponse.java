package com.toothfairy.auth.dto;

import com.toothfairy.clinic_admin.dto.ClinicAuthResponse;
import com.toothfairy.patient_auth.dto.PatientAuthResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class UnifiedLoginResponse {
    private String type;   // "dentist" | "clinic" | "patient"
    private String token;
    private AuthResponse.CabinetInfo     cabinet;
    private ClinicAuthResponse.ClinicInfo clinic;
    private PatientAuthResponse.PatientInfo patient;
}
