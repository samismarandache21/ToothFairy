package com.toothfairy.appointment.dto;

import com.toothfairy.appointment.Appointment;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class AppointmentResponse {

    private UUID id;
    private UUID patientId;
    private String patientFirstName;
    private String patientLastName;
    private UUID treatmentTypeId;
    private String treatmentTypeName;
    private String treatmentTypeColor;
    private Integer durationMinutes;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private String notes;
    private Boolean smsSent;
    private LocalDateTime createdAt;

    public static AppointmentResponse from(Appointment a) {
        int duration = 0;
        if (a.getStartTime() != null && a.getEndTime() != null) {
            duration = (int) java.time.Duration.between(a.getStartTime(), a.getEndTime()).toMinutes();
        }

        return AppointmentResponse.builder()
                .id(a.getId())
                .patientId(a.getPatient().getId())
                .patientFirstName(a.getPatient().getFirstName())
                .patientLastName(a.getPatient().getLastName())
                .treatmentTypeId(a.getTreatmentType() != null ? a.getTreatmentType().getId() : null)
                .treatmentTypeName(a.getTreatmentType() != null ? a.getTreatmentType().getName() : null)
                .treatmentTypeColor(a.getTreatmentType() != null ? a.getTreatmentType().getColor() : "#2DD4BF")
                .durationMinutes(duration)
                .startTime(a.getStartTime())
                .endTime(a.getEndTime())
                .status(a.getStatus())
                .notes(a.getNotes())
                .smsSent(a.getSmsSent())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
