package com.toothfairy.appointment;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.toothfairy.cabinet.Cabinet;
import com.toothfairy.patient.Patient;
import com.toothfairy.service.TreatmentType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "appointments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cabinet_id", nullable = false)
    private Cabinet cabinet;

    // Patient este accesat în AppointmentResponse.from() — EAGER pentru a evita N+1
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    // TreatmentType este accesat în AppointmentResponse.from() — EAGER
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "treatment_type_id")
    private TreatmentType treatmentType;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Builder.Default
    private String status = "confirmed";

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "sms_sent")
    @Builder.Default
    private Boolean smsSent = false;

    @Column(name = "sms_sent_at")
    private LocalDateTime smsSentAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
