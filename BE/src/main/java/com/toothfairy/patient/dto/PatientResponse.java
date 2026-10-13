package com.toothfairy.patient.dto;

import com.toothfairy.appointment.Appointment;
import com.toothfairy.patient.Patient;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class PatientResponse {

    private UUID   id;
    private String firstName;
    private String lastName;
    private String phone;
    private String email;
    private LocalDate birthDate;

    // medicalNotes mapat ca "notes" pentru compatibilitate frontend
    private String notes;
    private String allergies;

    private Integer totalVisits;
    private String  lastVisit;   // "YYYY-MM-DD" sau null
    private String  nextAppt;    // "YYYY-MM-DD" sau null

    private LocalDateTime createdAt;

    // Prezent doar pe getById
    private List<AppointmentHistoryItem> appointmentHistory;

    // ── Static factory fără history ──────────────────────────────────────
    public static PatientResponse from(Patient p, List<Appointment> appointments) {
        long completed = appointments.stream()
                .filter(a -> "completed".equals(a.getStatus()) || "no_show".equals(a.getStatus()))
                .count();

        String lastVisit = appointments.stream()
                .filter(a -> "completed".equals(a.getStatus()))
                .map(a -> a.getStartTime().toLocalDate().toString())
                .sorted((a, b) -> b.compareTo(a))   // desc
                .findFirst()
                .orElse(null);

        String nextAppt = appointments.stream()
                .filter(a -> "confirmed".equals(a.getStatus()) || "pending".equals(a.getStatus()))
                .filter(a -> a.getStartTime().isAfter(LocalDateTime.now()))
                .map(a -> a.getStartTime().toLocalDate().toString())
                .sorted()
                .findFirst()
                .orElse(null);

        return PatientResponse.builder()
                .id(p.getId())
                .firstName(p.getFirstName())
                .lastName(p.getLastName())
                .phone(p.getPhone())
                .email(p.getEmail())
                .birthDate(p.getBirthDate())
                .notes(p.getMedicalNotes())
                .allergies(p.getAllergies())
                .totalVisits((int) completed)
                .lastVisit(lastVisit)
                .nextAppt(nextAppt)
                .createdAt(p.getCreatedAt())
                .build();
    }

    // ── Static factory cu history (pentru getById) ────────────────────────
    public static PatientResponse fromWithHistory(Patient p, List<Appointment> appointments) {
        PatientResponse base = from(p, appointments);

        List<AppointmentHistoryItem> history = appointments.stream()
                .filter(a -> "completed".equals(a.getStatus()))
                .sorted((a, b) -> b.getStartTime().compareTo(a.getStartTime()))
                .map(AppointmentHistoryItem::from)
                .toList();

        return PatientResponse.builder()
                .id(base.getId())
                .firstName(base.getFirstName())
                .lastName(base.getLastName())
                .phone(base.getPhone())
                .email(base.getEmail())
                .birthDate(base.getBirthDate())
                .notes(base.getNotes())
                .allergies(base.getAllergies())
                .totalVisits(base.getTotalVisits())
                .lastVisit(base.getLastVisit())
                .nextAppt(base.getNextAppt())
                .createdAt(base.getCreatedAt())
                .appointmentHistory(history)
                .build();
    }

    // ── Inner: un item din istoricul programărilor ────────────────────────
    @Getter
    @Builder
    public static class AppointmentHistoryItem {
        private UUID   id;
        private String date;      // "YYYY-MM-DD"
        private String service;
        private int    duration;  // minute
        private java.math.BigDecimal price;
        private String status;    // "completed" | "no_show"

        static AppointmentHistoryItem from(Appointment a) {
            return AppointmentHistoryItem.builder()
                    .id(a.getId())
                    .date(a.getStartTime().toLocalDate().toString())
                    .service(a.getTreatmentType() != null ? a.getTreatmentType().getName() : "")
                    .duration(a.getTreatmentType() != null ? a.getTreatmentType().getDurationMinutes() : 0)
                    .price(a.getTreatmentType() != null ? a.getTreatmentType().getPrice() : null)
                    .status(a.getStatus())
                    .build();
        }
    }

    // ── Inner: item pentru istoricul complet cross-cabinet ───────────────
    @Getter
    @Builder
    public static class FullHistoryItem {
        private UUID   id;
        private String date;
        private String service;
        private int    duration;
        private java.math.BigDecimal price;
        private String cabinetName;
        private String doctorName;
        private boolean currentCabinet;

        public static FullHistoryItem from(Appointment a, boolean currentCabinet) {
            com.toothfairy.cabinet.Cabinet cab = a.getCabinet();
            String doctorName = (cab.getFirstName() != null ? cab.getFirstName() + " " : "")
                    + (cab.getLastName() != null ? cab.getLastName() : "");
            if (doctorName.isBlank()) doctorName = cab.getName();

            return FullHistoryItem.builder()
                    .id(a.getId())
                    .date(a.getStartTime().toLocalDate().toString())
                    .service(a.getTreatmentType() != null ? a.getTreatmentType().getName() : "")
                    .duration(a.getTreatmentType() != null ? a.getTreatmentType().getDurationMinutes() : 0)
                    .price(a.getTreatmentType() != null ? a.getTreatmentType().getPrice() : null)
                    .cabinetName(cab.getName())
                    .doctorName(doctorName.trim())
                    .currentCabinet(currentCabinet)
                    .build();
        }
    }
}
