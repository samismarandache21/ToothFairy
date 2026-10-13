package com.toothfairy.patient;

import com.toothfairy.appointment.AppointmentRepository;
import com.toothfairy.cabinet.Cabinet;
import com.toothfairy.cabinet.CabinetRepository;
import com.toothfairy.common.SecurityUtils;
import com.toothfairy.patient.dto.PatientRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatientServiceTest {

    @Mock PatientRepository     patientRepository;
    @Mock AppointmentRepository appointmentRepository;
    @Mock CabinetRepository     cabinetRepository;
    @Mock SecurityUtils         securityUtils;

    @InjectMocks PatientService service;

    private UUID    cabinetId;
    private UUID    patientId;
    private Cabinet cabinet;
    private Patient patient;

    @BeforeEach
    void setup() {
        cabinetId = UUID.randomUUID();
        patientId = UUID.randomUUID();
        cabinet   = Cabinet.builder().build();
        patient   = Patient.builder()
                .firstName("Ion")
                .lastName("Popescu")
                .phone("0721000001")
                .build();

        when(securityUtils.getCurrentCabinetId()).thenReturn(cabinetId);
    }

    // ── getAll ────────────────────────────────────────────────────────────────

    @Test
    void getAll_returnsMappedResponses() {
        when(patientRepository.findByCabinetIdOrderByLastNameAsc(cabinetId)).thenReturn(List.of(patient));
        when(appointmentRepository.findByCabinetIdOrderByStartTimeAsc(cabinetId)).thenReturn(List.of());

        var result = service.getAll();

        assertThat(result).hasSize(1);
    }

    // ── search ────────────────────────────────────────────────────────────────

    @Test
    void search_delegatesToRepository() {
        when(patientRepository.search(cabinetId, "pop")).thenReturn(List.of(patient));
        when(appointmentRepository.findByCabinetIdOrderByStartTimeAsc(cabinetId)).thenReturn(List.of());

        var result = service.search("pop");

        assertThat(result).hasSize(1);
        verify(patientRepository).search(cabinetId, "pop");
    }

    // ── getById ───────────────────────────────────────────────────────────────

    @Test
    void getById_existingPatient_returnsResponse() {
        when(patientRepository.findByIdAndCabinetId(patientId, cabinetId)).thenReturn(Optional.of(patient));
        when(appointmentRepository.findByCabinetIdOrderByStartTimeAsc(cabinetId)).thenReturn(List.of());

        var result = service.getById(patientId);

        assertThat(result).isNotNull();
    }

    @Test
    void getById_notFound_throws404() {
        when(patientRepository.findByIdAndCabinetId(patientId, cabinetId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(patientId))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode().value())
                .isEqualTo(404);
    }

    // ── create ────────────────────────────────────────────────────────────────

    @Test
    void create_newPhone_savesPatient() {
        PatientRequest req = buildRequest("0721000099");
        when(patientRepository.existsByCabinetIdAndPhone(cabinetId, "0721000099")).thenReturn(false);
        when(cabinetRepository.findById(cabinetId)).thenReturn(Optional.of(cabinet));
        when(patientRepository.save(any())).thenReturn(patient);

        var result = service.create(req);

        assertThat(result).isNotNull();
        verify(patientRepository).save(any(Patient.class));
    }

    @Test
    void create_duplicatePhone_throws409() {
        PatientRequest req = buildRequest("0721000001");
        when(patientRepository.existsByCabinetIdAndPhone(cabinetId, "0721000001")).thenReturn(true);

        assertThatThrownBy(() -> service.create(req))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode().value())
                .isEqualTo(409);
    }

    @Test
    void create_blankPhone_doesNotCheckDuplicate() {
        PatientRequest req = buildRequest("");
        when(cabinetRepository.findById(cabinetId)).thenReturn(Optional.of(cabinet));
        when(patientRepository.save(any())).thenReturn(patient);

        service.create(req);

        verify(patientRepository, never()).existsByCabinetIdAndPhone(any(), any());
    }

    @Test
    void create_nullPhone_doesNotCheckDuplicate() {
        PatientRequest req = buildRequest(null);
        when(cabinetRepository.findById(cabinetId)).thenReturn(Optional.of(cabinet));
        when(patientRepository.save(any())).thenReturn(patient);

        service.create(req);

        verify(patientRepository, never()).existsByCabinetIdAndPhone(any(), any());
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Test
    void update_samePhone_doesNotCheckDuplicate() {
        patient = Patient.builder().phone("0721000001").build();
        PatientRequest req = buildRequest("0721000001");
        when(patientRepository.findByIdAndCabinetId(patientId, cabinetId)).thenReturn(Optional.of(patient));
        when(patientRepository.save(any())).thenReturn(patient);

        service.update(patientId, req);

        verify(patientRepository, never()).existsByCabinetIdAndPhone(any(), any());
    }

    @Test
    void update_differentPhoneAlreadyUsed_throws409() {
        patient = Patient.builder().phone("0721000001").build();
        PatientRequest req = buildRequest("0721000002");
        when(patientRepository.findByIdAndCabinetId(patientId, cabinetId)).thenReturn(Optional.of(patient));
        when(patientRepository.existsByCabinetIdAndPhone(cabinetId, "0721000002")).thenReturn(true);

        assertThatThrownBy(() -> service.update(patientId, req))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode().value())
                .isEqualTo(409);
    }

    @Test
    void update_patientNotFound_throws404() {
        when(patientRepository.findByIdAndCabinetId(patientId, cabinetId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(patientId, buildRequest("0721000099")))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode().value())
                .isEqualTo(404);
    }

    // ── delete ────────────────────────────────────────────────────────────────

    @Test
    void delete_existingPatient_deletesAppointmentsFirst() {
        when(patientRepository.findByIdAndCabinetId(patientId, cabinetId)).thenReturn(Optional.of(patient));

        service.delete(patientId);

        var inOrder = inOrder(appointmentRepository, patientRepository);
        inOrder.verify(appointmentRepository).deleteByPatientId(patientId);
        inOrder.verify(patientRepository).delete(patient);
    }

    @Test
    void delete_notFound_throws404() {
        when(patientRepository.findByIdAndCabinetId(patientId, cabinetId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(patientId))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode().value())
                .isEqualTo(404);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private PatientRequest buildRequest(String phone) {
        PatientRequest req = new PatientRequest();
        req.setFirstName("Ion");
        req.setLastName("Popescu");
        req.setPhone(phone);
        return req;
    }
}
