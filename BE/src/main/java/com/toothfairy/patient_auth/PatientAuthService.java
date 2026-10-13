package com.toothfairy.patient_auth;

import com.toothfairy.appointment.Appointment;
import com.toothfairy.appointment.AppointmentRepository;
import com.toothfairy.patient.Patient;
import com.toothfairy.patient.PatientRepository;
import com.toothfairy.patient_auth.dto.PatientAuthResponse;
import com.toothfairy.patient_auth.dto.PatientBookingResponse;
import com.toothfairy.patient_auth.dto.PatientLoginRequest;
import com.toothfairy.patient_auth.dto.PatientRegisterRequest;
import com.toothfairy.review.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PatientAuthService {

    private final PatientAccountRepository patientAccountRepository;
    private final PatientJwtService        patientJwtService;
    private final PasswordEncoder          passwordEncoder;
    private final PatientRepository        patientRepository;
    private final AppointmentRepository    appointmentRepository;
    private final ReviewRepository         reviewRepository;

    public PatientAuthResponse register(PatientRegisterRequest req) {
        if (patientAccountRepository.existsByEmail(req.getEmail().toLowerCase().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email deja înregistrat");
        }
        PatientAccount account = PatientAccount.builder()
                .email(req.getEmail().toLowerCase().trim())
                .phone(req.getPhone().trim())
                .firstName(req.getFirstName().trim())
                .lastName(req.getLastName().trim())
                .password(passwordEncoder.encode(req.getPassword()))
                .build();
        patientAccountRepository.save(account);

        String token = patientJwtService.generateToken(account.getId(), account.getEmail());
        return buildResponse(token, account);
    }

    public PatientAuthResponse login(PatientLoginRequest req) {
        PatientAccount account = patientAccountRepository.findByEmail(req.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email sau parolă incorectă"));

        if (!passwordEncoder.matches(req.getPassword(), account.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email sau parolă incorectă");
        }

        String token = patientJwtService.generateToken(account.getId(), account.getEmail());
        return buildResponse(token, account);
    }

    public PatientAccount getAccount(UUID id) {
        return patientAccountRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cont negăsit"));
    }

    public List<PatientBookingResponse> getBookings(UUID patientAccountId) {
        PatientAccount account = getAccount(patientAccountId);

        // Găsim înregistrările de pacient cu același telefon și email compatibil (cross-cabinet)
        List<Patient> patients = patientRepository.findByPhoneAndMatchingEmail(
                account.getPhone(), account.getEmail());

        return patients.stream()
                .flatMap(p -> appointmentRepository.findByPatientId(p.getId()).stream()
                        .map(a -> mapBooking(a, p)))
                .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
                .toList();
    }

    public void cancelBooking(UUID appointmentId, UUID patientAccountId) {
        PatientAccount account = getAccount(patientAccountId);
        List<Patient> patients = patientRepository.findByPhoneAndMatchingEmail(
                account.getPhone(), account.getEmail());

        Appointment appt = patients.stream()
                .flatMap(p -> appointmentRepository.findByPatientId(p.getId()).stream())
                .filter(a -> a.getId().equals(appointmentId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Programare negăsită"));

        if ("cancelled".equals(appt.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Programarea este deja anulată");
        }
        appt.setStatus("cancelled");
        appointmentRepository.save(appt);
    }

    // ── Helper ───────────────────────────────────────────────────────────────
    private PatientAuthResponse buildResponse(String token, PatientAccount account) {
        return PatientAuthResponse.builder()
                .token(token)
                .patient(PatientAuthResponse.PatientInfo.builder()
                        .id(account.getId())
                        .firstName(account.getFirstName())
                        .lastName(account.getLastName())
                        .email(account.getEmail())
                        .phone(account.getPhone())
                        .build())
                .build();
    }

    private PatientBookingResponse mapBooking(Appointment a, Patient p) {
        var cabinet = p.getCabinet();
        String slug = (cabinet.getSlug() != null && !cabinet.getSlug().isBlank()) ? cabinet.getSlug() : cabinet.getId().toString();
        String service = a.getTreatmentType() != null ? a.getTreatmentType().getName() : "Consultație";
        Object price   = a.getTreatmentType() != null ? a.getTreatmentType().getPrice() : null;
        int duration   = a.getTreatmentType() != null ? a.getTreatmentType().getDurationMinutes() :
                (int) java.time.Duration.between(a.getStartTime(), a.getEndTime()).toMinutes();

        return PatientBookingResponse.builder()
                .id(a.getId())
                .cabinetSlug(slug)
                .cabinetName(cabinet.getName())
                .cabinetCity(cabinet.getCity() != null ? cabinet.getCity() : "")
                .cabinetSpecialties(cabinet.getSpecialties() != null ? cabinet.getSpecialties() : "[]")
                .dentistFirstName(cabinet.getFirstName() != null ? cabinet.getFirstName() : "")
                .dentistLastName(cabinet.getLastName()  != null ? cabinet.getLastName()  : "")
                .service(service)
                .price(price)
                .date(a.getStartTime().toLocalDate().toString())
                .time(String.format("%02d:%02d",
                        a.getStartTime().getHour(), a.getStartTime().getMinute()))
                .durationMinutes(duration)
                .status(a.getStatus())
                .hasReview(reviewRepository.existsByAppointmentId(a.getId()))
                .build();
    }
}
