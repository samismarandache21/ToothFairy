package com.toothfairy.appointment;

import com.toothfairy.appointment.dto.AppointmentRequest;
import com.toothfairy.appointment.dto.AppointmentResponse;
import com.toothfairy.cabinet.Cabinet;
import com.toothfairy.cabinet.CabinetRepository;
import com.toothfairy.common.SecurityUtils;
import com.toothfairy.patient.Patient;
import com.toothfairy.patient.PatientRepository;
import com.toothfairy.service.TreatmentType;
import com.toothfairy.service.TreatmentTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private static final UUID ZERO_UUID = new UUID(0, 0);

    private final AppointmentRepository   appointmentRepository;
    private final PatientRepository       patientRepository;
    private final TreatmentTypeRepository treatmentTypeRepository;
    private final CabinetRepository       cabinetRepository;
    private final SecurityUtils           securityUtils;

    public List<AppointmentResponse> getAll(LocalDate date) {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        List<Appointment> list;

        if (date != null) {
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end   = date.atTime(LocalTime.MAX);
            list = appointmentRepository.findByDay(cabinetId, start, end);
        } else {
            list = appointmentRepository.findByCabinetIdOrderByStartTimeAsc(cabinetId);
        }

        return list.stream().map(AppointmentResponse::from).toList();
    }

    public List<AppointmentResponse> getToday() {
        return getAll(LocalDate.now());
    }

    public List<AppointmentResponse> getUpcoming() {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime in7Days = now.plusDays(7);
        return appointmentRepository.findByRange(cabinetId, now, in7Days)
                .stream().map(AppointmentResponse::from).toList();
    }

    public boolean checkConflict(LocalDateTime startTime, LocalDateTime endTime, UUID excludeId) {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        UUID safeExclude = excludeId != null ? excludeId : ZERO_UUID;
        return appointmentRepository.existsConflict(cabinetId, startTime, endTime, safeExclude);
    }

    public AppointmentResponse create(AppointmentRequest request) {
        UUID cabinetId = securityUtils.getCurrentCabinetId();

        if (appointmentRepository.existsConflict(
                cabinetId, request.getStartTime(), request.getEndTime(), ZERO_UUID)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Există deja o programare în acest interval orar");
        }

        Cabinet cabinet = cabinetRepository.findById(cabinetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cabinet negăsit"));

        Patient patient = patientRepository.findByIdAndCabinetId(request.getPatientId(), cabinetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pacient negăsit"));

        TreatmentType treatmentType = null;
        if (request.getTreatmentTypeId() != null) {
            treatmentType = treatmentTypeRepository
                    .findByIdAndCabinetId(request.getTreatmentTypeId(), cabinetId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviciu negăsit"));
        }

        Appointment appt = Appointment.builder()
                .cabinet(cabinet)
                .patient(patient)
                .treatmentType(treatmentType)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(request.getStatus() != null ? request.getStatus() : "confirmed")
                .notes(request.getNotes())
                .build();

        return AppointmentResponse.from(appointmentRepository.save(appt));
    }

    public AppointmentResponse update(UUID id, AppointmentRequest request) {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        Appointment appt = appointmentRepository.findByIdAndCabinetId(id, cabinetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Programare negăsită"));

        // Skip conflict check when cancelling — a cancelled appointment doesn't occupy the slot
        boolean cancelling = "cancelled".equals(request.getStatus());
        if (!cancelling && appointmentRepository.existsConflict(
                cabinetId, request.getStartTime(), request.getEndTime(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Există deja o programare în acest interval orar");
        }

        Patient patient = patientRepository.findByIdAndCabinetId(request.getPatientId(), cabinetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pacient negăsit"));

        TreatmentType treatmentType = null;
        if (request.getTreatmentTypeId() != null) {
            treatmentType = treatmentTypeRepository
                    .findByIdAndCabinetId(request.getTreatmentTypeId(), cabinetId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviciu negăsit"));
        }

        appt.setPatient(patient);
        appt.setTreatmentType(treatmentType);
        appt.setStartTime(request.getStartTime());
        appt.setEndTime(request.getEndTime());
        appt.setStatus(request.getStatus());
        appt.setNotes(request.getNotes());

        return AppointmentResponse.from(appointmentRepository.save(appt));
    }

    private static final java.util.Set<String> VALID_STATUSES =
            java.util.Set.of("confirmed", "pending", "cancelled", "completed", "no_show");

    public AppointmentResponse updateStatus(UUID id, String status) {
        if (status == null || !VALID_STATUSES.contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Status invalid. Valori acceptate: confirmed, pending, cancelled, completed, no_show");
        }
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        Appointment appt = appointmentRepository.findByIdAndCabinetId(id, cabinetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Programare negăsită"));
        appt.setStatus(status);
        return AppointmentResponse.from(appointmentRepository.save(appt));
    }

    public void delete(UUID id) {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        Appointment appt = appointmentRepository.findByIdAndCabinetId(id, cabinetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Programare negăsită"));
        appointmentRepository.delete(appt);
    }
}
