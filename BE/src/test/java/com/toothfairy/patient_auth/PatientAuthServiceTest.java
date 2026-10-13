package com.toothfairy.patient_auth;

import com.toothfairy.appointment.Appointment;
import com.toothfairy.appointment.AppointmentRepository;
import com.toothfairy.cabinet.Cabinet;
import com.toothfairy.patient.Patient;
import com.toothfairy.patient.PatientRepository;
import com.toothfairy.patient_auth.dto.PatientLoginRequest;
import com.toothfairy.patient_auth.dto.PatientRegisterRequest;
import com.toothfairy.review.ReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatientAuthServiceTest {

    @Mock PatientAccountRepository patientAccountRepository;
    @Mock PatientJwtService        patientJwtService;
    @Mock PasswordEncoder          passwordEncoder;
    @Mock PatientRepository        patientRepository;
    @Mock AppointmentRepository    appointmentRepository;
    @Mock ReviewRepository         reviewRepository;

    @InjectMocks PatientAuthService service;

    private PatientAccount account;
    private UUID           accountId;

    @BeforeEach
    void setup() {
        accountId = UUID.randomUUID();
        account   = PatientAccount.builder()
                .id(accountId)
                .email("pacient@test.ro")
                .phone("0721000001")
                .firstName("Maria")
                .lastName("Pop")
                .password("hashed_pw")
                .build();
    }

    // ── register ──────────────────────────────────────────────────────────────

    @Test
    void register_newEmail_savesAccountAndReturnsToken() {
        when(patientAccountRepository.existsByEmail("pacient@test.ro")).thenReturn(false);
        when(passwordEncoder.encode("parola123")).thenReturn("hashed_pw");
        when(patientAccountRepository.save(any())).thenReturn(account);
        when(patientJwtService.generateToken(any(), any())).thenReturn("patient_jwt");

        var result = service.register(buildRegisterRequest());

        assertThat(result.getToken()).isEqualTo("patient_jwt");
        assertThat(result.getPatient().getEmail()).isEqualTo("pacient@test.ro");
        assertThat(result.getPatient().getFirstName()).isEqualTo("Maria");
        verify(patientAccountRepository).save(any(PatientAccount.class));
    }

    @Test
    void register_duplicateEmail_throws409() {
        when(patientAccountRepository.existsByEmail("pacient@test.ro")).thenReturn(true);

        assertThatThrownBy(() -> service.register(buildRegisterRequest()))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode().value())
                .isEqualTo(409);

        verify(patientAccountRepository, never()).save(any());
    }

    @Test
    void register_emailNormalized_toLowerCase() {
        PatientRegisterRequest req = buildRegisterRequest();
        req.setEmail("PACIENT@TEST.RO");
        when(patientAccountRepository.existsByEmail("pacient@test.ro")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(patientAccountRepository.save(any())).thenReturn(account);
        when(patientJwtService.generateToken(any(), any())).thenReturn("tok");

        service.register(req);

        verify(patientAccountRepository).existsByEmail("pacient@test.ro");
    }

    @Test
    void register_passwordIsHashed() {
        when(patientAccountRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode("parola123")).thenReturn("hashed_pw");
        when(patientAccountRepository.save(any())).thenReturn(account);
        when(patientJwtService.generateToken(any(), any())).thenReturn("tok");

        service.register(buildRegisterRequest());

        verify(passwordEncoder).encode("parola123");
        verify(patientAccountRepository).save(argThat(a -> "hashed_pw".equals(a.getPassword())));
    }

    @Test
    void register_tokenGeneratedWithAccountId() {
        when(patientAccountRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(patientAccountRepository.save(any())).thenReturn(account);
        when(patientJwtService.generateToken(accountId, "pacient@test.ro")).thenReturn("jwt");

        service.register(buildRegisterRequest());

        verify(patientJwtService).generateToken(accountId, "pacient@test.ro");
    }

    // ── login ─────────────────────────────────────────────────────────────────

    @Test
    void login_correctCredentials_returnsTokenAndPatientInfo() {
        when(patientAccountRepository.findByEmail("pacient@test.ro")).thenReturn(Optional.of(account));
        when(passwordEncoder.matches("parola123", "hashed_pw")).thenReturn(true);
        when(patientJwtService.generateToken(any(), any())).thenReturn("patient_jwt");

        var result = service.login(buildLoginRequest());

        assertThat(result.getToken()).isEqualTo("patient_jwt");
        assertThat(result.getPatient().getFirstName()).isEqualTo("Maria");
        assertThat(result.getPatient().getPhone()).isEqualTo("0721000001");
    }

    @Test
    void login_emailNotFound_throws401() {
        when(patientAccountRepository.findByEmail("pacient@test.ro")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.login(buildLoginRequest()))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode().value())
                .isEqualTo(401);
    }

    @Test
    void login_wrongPassword_throws401() {
        when(patientAccountRepository.findByEmail("pacient@test.ro")).thenReturn(Optional.of(account));
        when(passwordEncoder.matches("parola123", "hashed_pw")).thenReturn(false);

        assertThatThrownBy(() -> service.login(buildLoginRequest()))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode().value())
                .isEqualTo(401);
    }

    @Test
    void login_emailNormalized_toLowerCase() {
        PatientLoginRequest req = buildLoginRequest();
        req.setEmail("PACIENT@TEST.RO");
        when(patientAccountRepository.findByEmail("pacient@test.ro")).thenReturn(Optional.of(account));
        when(passwordEncoder.matches(any(), any())).thenReturn(true);
        when(patientJwtService.generateToken(any(), any())).thenReturn("tok");

        service.login(req);

        verify(patientAccountRepository).findByEmail("pacient@test.ro");
    }

    // ── getAccount ────────────────────────────────────────────────────────────

    @Test
    void getAccount_existingId_returnsAccount() {
        when(patientAccountRepository.findById(accountId)).thenReturn(Optional.of(account));

        var result = service.getAccount(accountId);

        assertThat(result.getEmail()).isEqualTo("pacient@test.ro");
    }

    @Test
    void getAccount_unknownId_throws404() {
        when(patientAccountRepository.findById(accountId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getAccount(accountId))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode().value())
                .isEqualTo(404);
    }

    // ── getBookings ───────────────────────────────────────────────────────────

    @Test
    void getBookings_noMatchingPatient_returnsEmptyList() {
        when(patientAccountRepository.findById(accountId)).thenReturn(Optional.of(account));
        when(patientRepository.findByPhoneAndMatchingEmail("0721000001", "pacient@test.ro"))
                .thenReturn(List.of());

        var result = service.getBookings(accountId);

        assertThat(result).isEmpty();
    }

    @Test
    void getBookings_withMatchingPatient_returnsMappedBookings() {
        Cabinet cabinet = Cabinet.builder()
                .id(UUID.randomUUID()).name("Clinica Test")
                .firstName("Ion").lastName("Medic").city("Cluj")
                .slug("clinica-test")
                .build();

        Patient patient = Patient.builder()
                .id(UUID.randomUUID()).cabinet(cabinet).build();

        Appointment appt = Appointment.builder()
                .id(UUID.randomUUID()).cabinet(cabinet).patient(patient)
                .startTime(LocalDateTime.of(2026, 6, 10, 9, 0))
                .endTime(LocalDateTime.of(2026, 6, 10, 9, 30))
                .status("confirmed")
                .build();

        when(patientAccountRepository.findById(accountId)).thenReturn(Optional.of(account));
        when(patientRepository.findByPhoneAndMatchingEmail("0721000001", "pacient@test.ro"))
                .thenReturn(List.of(patient));
        when(appointmentRepository.findByPatientId(patient.getId())).thenReturn(List.of(appt));
        when(reviewRepository.existsByAppointmentId(appt.getId())).thenReturn(false);

        var result = service.getBookings(accountId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCabinetName()).isEqualTo("Clinica Test");
        assertThat(result.get(0).getStatus()).isEqualTo("confirmed");
        assertThat(result.get(0).getDate()).isEqualTo("2026-06-10");
        assertThat(result.get(0).getTime()).isEqualTo("09:00");
    }

    @Test
    void getBookings_multiplePatientRecords_aggregatesAllBookings() {
        Cabinet c1 = Cabinet.builder().id(UUID.randomUUID()).name("Clinica A").firstName("A").lastName("B").slug("slug-a").build();
        Cabinet c2 = Cabinet.builder().id(UUID.randomUUID()).name("Clinica B").firstName("C").lastName("D").slug("slug-b").build();

        Patient p1 = Patient.builder().id(UUID.randomUUID()).cabinet(c1).build();
        Patient p2 = Patient.builder().id(UUID.randomUUID()).cabinet(c2).build();

        Appointment a1 = Appointment.builder().id(UUID.randomUUID()).cabinet(c1).patient(p1)
                .startTime(LocalDateTime.of(2026, 6, 10, 9, 0))
                .endTime(LocalDateTime.of(2026, 6, 10, 9, 30))
                .status("confirmed").build();
        Appointment a2 = Appointment.builder().id(UUID.randomUUID()).cabinet(c2).patient(p2)
                .startTime(LocalDateTime.of(2026, 6, 11, 10, 0))
                .endTime(LocalDateTime.of(2026, 6, 11, 10, 30))
                .status("completed").build();

        when(patientAccountRepository.findById(accountId)).thenReturn(Optional.of(account));
        when(patientRepository.findByPhoneAndMatchingEmail("0721000001", "pacient@test.ro"))
                .thenReturn(List.of(p1, p2));
        when(appointmentRepository.findByPatientId(p1.getId())).thenReturn(List.of(a1));
        when(appointmentRepository.findByPatientId(p2.getId())).thenReturn(List.of(a2));
        when(reviewRepository.existsByAppointmentId(any())).thenReturn(false);

        var result = service.getBookings(accountId);

        assertThat(result).hasSize(2);
        // sorted desc by date → a2 (2026-06-11) first
        assertThat(result.get(0).getDate()).isEqualTo("2026-06-11");
        assertThat(result.get(1).getDate()).isEqualTo("2026-06-10");
    }

    @Test
    void getBookings_hasReview_flaggedInResponse() {
        Cabinet cabinet = Cabinet.builder().id(UUID.randomUUID()).name("C").firstName("X").lastName("Y").slug("s").build();
        Patient patient = Patient.builder().id(UUID.randomUUID()).cabinet(cabinet).build();
        Appointment appt = Appointment.builder().id(UUID.randomUUID()).cabinet(cabinet).patient(patient)
                .startTime(LocalDateTime.of(2026, 6, 10, 9, 0))
                .endTime(LocalDateTime.of(2026, 6, 10, 9, 30))
                .status("completed").build();

        when(patientAccountRepository.findById(accountId)).thenReturn(Optional.of(account));
        when(patientRepository.findByPhoneAndMatchingEmail(any(), any())).thenReturn(List.of(patient));
        when(appointmentRepository.findByPatientId(patient.getId())).thenReturn(List.of(appt));
        when(reviewRepository.existsByAppointmentId(appt.getId())).thenReturn(true);

        var result = service.getBookings(accountId);

        assertThat(result.get(0).isHasReview()).isTrue();
    }

    // ── cancelBooking ─────────────────────────────────────────────────────────

    @Test
    void cancelBooking_ownAppointment_setsStatusCancelled() {
        UUID apptId = UUID.randomUUID();
        Cabinet cabinet = Cabinet.builder().id(UUID.randomUUID()).build();
        Patient patient = Patient.builder().id(UUID.randomUUID()).cabinet(cabinet).build();
        Appointment appt = Appointment.builder().id(apptId).cabinet(cabinet).patient(patient)
                .startTime(LocalDateTime.now().plusDays(1))
                .endTime(LocalDateTime.now().plusDays(1).plusMinutes(30))
                .status("confirmed").build();

        when(patientAccountRepository.findById(accountId)).thenReturn(Optional.of(account));
        when(patientRepository.findByPhoneAndMatchingEmail(any(), any())).thenReturn(List.of(patient));
        when(appointmentRepository.findByPatientId(patient.getId())).thenReturn(List.of(appt));

        service.cancelBooking(apptId, accountId);

        assertThat(appt.getStatus()).isEqualTo("cancelled");
        verify(appointmentRepository).save(appt);
    }

    @Test
    void cancelBooking_alreadyCancelled_throws400() {
        UUID apptId = UUID.randomUUID();
        Cabinet cabinet = Cabinet.builder().id(UUID.randomUUID()).build();
        Patient patient = Patient.builder().id(UUID.randomUUID()).cabinet(cabinet).build();
        Appointment appt = Appointment.builder().id(apptId).cabinet(cabinet).patient(patient)
                .startTime(LocalDateTime.now()).endTime(LocalDateTime.now().plusMinutes(30))
                .status("cancelled").build();

        when(patientAccountRepository.findById(accountId)).thenReturn(Optional.of(account));
        when(patientRepository.findByPhoneAndMatchingEmail(any(), any())).thenReturn(List.of(patient));
        when(appointmentRepository.findByPatientId(patient.getId())).thenReturn(List.of(appt));

        assertThatThrownBy(() -> service.cancelBooking(apptId, accountId))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode().value())
                .isEqualTo(400);
    }

    @Test
    void cancelBooking_appointmentNotBelongingToPatient_throws404() {
        UUID apptId = UUID.randomUUID();
        UUID otherApptId = UUID.randomUUID();
        Cabinet cabinet = Cabinet.builder().id(UUID.randomUUID()).build();
        Patient patient = Patient.builder().id(UUID.randomUUID()).cabinet(cabinet).build();
        Appointment appt = Appointment.builder().id(otherApptId).cabinet(cabinet).patient(patient)
                .startTime(LocalDateTime.now()).endTime(LocalDateTime.now().plusMinutes(30))
                .status("confirmed").build();

        when(patientAccountRepository.findById(accountId)).thenReturn(Optional.of(account));
        when(patientRepository.findByPhoneAndMatchingEmail(any(), any())).thenReturn(List.of(patient));
        when(appointmentRepository.findByPatientId(patient.getId())).thenReturn(List.of(appt));

        assertThatThrownBy(() -> service.cancelBooking(apptId, accountId))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode().value())
                .isEqualTo(404);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private PatientRegisterRequest buildRegisterRequest() {
        PatientRegisterRequest req = new PatientRegisterRequest();
        req.setEmail("pacient@test.ro");
        req.setPassword("parola123");
        req.setFirstName("Maria");
        req.setLastName("Pop");
        req.setPhone("0721000001");
        return req;
    }

    private PatientLoginRequest buildLoginRequest() {
        PatientLoginRequest req = new PatientLoginRequest();
        req.setEmail("pacient@test.ro");
        req.setPassword("parola123");
        return req;
    }
}
