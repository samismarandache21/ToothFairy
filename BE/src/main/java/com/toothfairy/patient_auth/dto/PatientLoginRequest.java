package com.toothfairy.patient_auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PatientLoginRequest {
    @NotBlank private String email;
    @NotBlank private String password;
}
