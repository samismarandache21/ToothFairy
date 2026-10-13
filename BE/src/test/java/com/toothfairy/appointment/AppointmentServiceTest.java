package com.toothfairy.appointment;

import com.toothfairy.appointment.dto.AppointmentRequest;
import com.toothfairy.cabinet.Cabinet;
import com.toothfairy.cabinet.CabinetRepository;
import com.toothfairy.common.SecurityUtils;
import com.toothfairy.patient.Patient;
import com.toothfairy.patient.PatientRepository;
import com.toothfairy.service.TreatmentType;
import com.toothfairy.service.TreatmentTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AppointmentServiceTest {

    @Mock AppointmentRepository   appointmentRepository;
    @Mock PatientRepository       patientRepository;
    @Mock TreatmentTypeRepository treatmentTypeRepository;
    @Mock CabinetRepository       cabinetRepository;
    @Mock SecurityUtils           securityUtils;

    @InjectMocks AppointmentService service;

    private UUID cabinetId;
    private UUID patientId;
    private UUID apptId;
    private Cabinet cabinet;
    private Patient patient;
    private Appointment appointment;

    @BeforeEach
    void setup() {
        cabinetId = UUID.randomUUID();
        patientId = UUID.randomUUID();
        apptId    = UUID.randomUUID();

        cabinet = Cabinet.builder().build();
        patient = Patient.builder().build();

        appointment = Appointment.builder()
                .cabinet(cabinet)
                .patient(patient)
                .startTime(LocalDateTime.of(2026, 6, 10, 9, 0))
                .endTime(LocalDateTime.of(2026, 6, 10, 9, 30))
                .status("confirmed")
                .build();

        when(securityUtils.getCurrentCabinetId()).thenReturn(cabinetId);
    }

    // ── getAll ────────────────────────────────────────────────────────────────

    @Test
    void getAll_noDate_returnsAllSortedAppointments() {
        when(appointmentRepository.findByCabinetIdOrderByStartTimeAsc(cabinetId))
                .thenReturn(List.of(appointment));

        var result = service.getAll(null);

        assertThat(result).hasSize(1);
        verify(appointmentRepository).findByCabinetIdOrderByStartTimeAsc(cabinetId);
    }

    @Test
    void getAll_withDate_queriesForThatDay() {
        LocalDate date = LocalDate.of(2026, 6, 10);
        when(appointmentRepository.findByDay(eq(cabinetId), any(), any()))
                .thenReturn(List.of(appointment));

        var result = service.getAll(date);

        assertThat(result).hasSize(1);
        verify(appointmentRepository).findByDay(eq(cabinetId), any(LocalDateTime.class), any(LocalDateTime.class));
    }

    @Test
    void getToday_delegatesToGetAllWithToday() {
        when(appointmentRepository.findByDay(eq(cabinetId), any(), any()))
                .thenReturn(List.of());
        service.getToday();
        verify(appointmentRepository).findByDay(eq(cabinetId), any(), any());
    }

    // ── checkConflict ─────────────────────────────────────────────────────────

    @Test
    void checkConflict_delegatesToRepository() {
        LocalDateTime start = LocalDateTime.of(2026, 6, 10, 9, 0);
        LocalDateTime end   = LocalDateTime.of(2026, 6, 10, 9, 30);
        when(appointmentRepository.existsConflict(eq(cabinetId), eq(start), eq(end), any()))
                .thenReturn(true);

        assertThat(service.checkConflict(start, end, null)).isTrue();
    }

    // ── create ────────────────────────────────────────────────────────────────

    @Test
    void create_noConflict_savesAndReturnsResponse() {
        AppointmentRequest req = buildRequest();
        when(appointmentRepository.existsConflict(any(), any(), any(), any())).thenReturn(false);
        when(cabinetRepository.findById(cabinetId)).thenReturn(Optional.of(cabinet));
        when(patientRepository.findByIdAndCabinetId(patientId, cabinetId)).thenReturn(Optional.of(patient));
        when(appointmentRepository.save(any())).thenReturn(appointment);

        var result = service.create(req);

        assertThat(result).isNotNull();
        verify(appointmentRepository).save(any(Appointment.class));
    }

    @Test
    void create_conflictExists_throwsConflict() {
        AppointmentRequest req = buildRequest();
        when(appointmentRepository.existsConflict(any(), any(), any(), any())).thenReturn(true);

        assertThatThrownBy(() -> service.create(req))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode().value())
                .isEqualTo(409);
    }

    @Test
    void create_patientNotFound_throwsNotFound() {
        AppointmentRequest req = buildRequest();
        when(appointmentRepository.existsConflict(any(), any(), any(), any())).thenReturn(false);
        when(cabinetRepository.findById(cabinetId)).thenReturn(Optional.of(cabinet));
        when(patientRepository.findByIdAndCabinetId(patientId, cabinetId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(req))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode().value())
                .isEqualTo(404);
    }

    @Test
    void create_withTreatmentTypeId_lookupsTreatmentType() {
        UUID treatmentId = UUID.randomUUID();
        AppointmentRequest req = buildRequest();
        req.setTreatmentTypeId(treatmentId);
        TreatmentType tt = TreatmentType.builder().build();

        when(appointmentRepository.existsConflict(any(), any(), any(), any())).thenReturn(false);
        when(cabinetRepository.findById(cabinetId)).thenReturn(Optional.of(cabinet));
        when(patientRepository.findByIdAndCabinetId(patientId, cabinetId)).thenReturn(Optional.of(patient));
        when(treatmentTypeRepository.findByIdAndCabinetId(treatmentId, cabinetId)).thenReturn(Optional.of(tt));
        when(appointmentRepository.save(any())).thenReturn(appointment);

        service.create(req);

        verify(treatmentTypeRepository).findByIdAndCabinetId(treatmentId, cabinetId);
    }

    // ── updateStatus ──────────────────────────────────────────────────────────

    @Test
    void updateStatus_validStatus_updatesAndReturns() {
        when(appointmentRepository.findByIdAndCabinetId(apptId, cabinetId))
                .thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any())).thenReturn(appointment);

        var result = service.updateStatus(apptId, "completed");

        assertThat(result).isNotNull();
        assertThat(appointment.getStatus()).isEqualTo("completed");
    }

    @Test
    void updateStatus_invalidStatus_throwsBadRequest() {
        assertThatThrownBy(() -> service.updateStatus(apptId, "invalid_status"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode().value())
                .isEqualTo(400);
    }

    @Test
    void updateStatus_nullStatus_throwsBadRequest() {
        assertThatThrownBy(() -> service.updateStatus(apptId, null))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode().value())
                .isEqualTo(400);
    }

    @Test
    void updateStatus_appointmentNotFound_throwsNotFound() {
        when(appointmentRepository.findByIdAndCabinetId(apptId, cabinetId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateStatus(apptId, "confirmed"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode().value())
                .isEqualTo(404);
    }

    @Test
    void updateStatus_allValidStatuses_doNotThrow() {
        when(appointmentRepository.findByIdAndCabinetId(any(), any()))
                .thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any())).thenReturn(appointment);

        for (String s : List.of("confirmed", "pending", "cancelled", "completed", "no_show")) {
            assertThatCode(() -> service.updateStatus(apptId, s)).doesNotThrowAnyException();
        }
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Test
    void update_noConflict_savesAppointment() {
        AppointmentRequest req = buildRequest();
        when(appointmentRepository.findByIdAndCabinetId(apptId, cabinetId)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.existsConflict(any(), any(), any(), any())).thenReturn(false);
        when(patientRepository.findByIdAndCabinetId(patientId, cabinetId)).thenReturn(Optional.of(patient));
        when(appointmentRepository.save(any())).thenReturn(appointment);

        var result = service.update(apptId, req);
        assertThat(result).isNotNull();
    }

    @Test
    void update_statusCancelling_skipsConflictCheck() {
        AppointmentRequest req = buildRequest();
        req.setStatus("cancelled");
        when(appointmentRepository.findByIdAndCabinetId(apptId, cabinetId)).thenReturn(Optional.of(appointment));
        when(patientRepository.findByIdAndCabinetId(patientId, cabinetId)).thenReturn(Optional.of(patient));
        when(appointmentRepository.save(any())).thenReturn(appointment);

        service.update(apptId, req);

        verify(appointmentRepository, never()).existsConflict(any(), any(), any(), any());
    }

    // ── delete ────────────────────────────────────────────────────────────────

    @Test
    void delete_existingAppointment_deletesIt() {
        when(appointmentRepository.findByIdAndCabinetId(apptId, cabinetId)).thenReturn(Optional.of(appointment));

        assertThatCode(() -> service.delete(apptId)).doesNotThrowAnyException();
        verify(appointmentRepository).delete(appointment);
    }

    @Test
    void delete_notFound_throwsNotFound() {
        when(appointmentRepository.findByIdAndCabinetId(apptId, cabinetId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(apptId))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode().value())
                .isEqualTo(404);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AppointmentRequest buildRequest() {
        AppointmentRequest req = new AppointmentRequest();
        req.setPatientId(patientId);
        req.setStartTime(LocalDateTime.of(2026, 6, 10, 9, 0));
        req.setEndTime(LocalDateTime.of(2026, 6, 10, 9, 30));
        req.setStatus("confirmed");
        return req;
    }
}
