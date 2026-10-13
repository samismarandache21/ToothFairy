package com.toothfairy.patient.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class PatientRequest {

    @NotBlank(message = "Prenumele este obligatoriu")
    private String firstName;

    private String lastName;

    private String phone;

    private String email;
    private LocalDate birthDate;
    private String medicalNotes;
    private String allergies;
}
