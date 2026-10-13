package com.toothfairy.appointment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class AppointmentRequest {

    @NotNull(message = "Pacientul este obligatoriu")
    private UUID patientId;

    private UUID treatmentTypeId;

    @NotNull(message = "Ora de start este obligatorie")
    private LocalDateTime startTime;

    @NotNull(message = "Ora de final este obligatorie")
    private LocalDateTime endTime;

    private String status = "confirmed";
    private String notes;
}
