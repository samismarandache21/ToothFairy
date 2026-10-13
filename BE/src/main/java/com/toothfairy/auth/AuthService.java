package com.toothfairy.auth;

import com.toothfairy.auth.dto.AuthResponse;
import com.toothfairy.auth.dto.LoginRequest;
import com.toothfairy.auth.dto.RegisterRequest;
import com.toothfairy.auth.dto.UnifiedLoginResponse;
import com.toothfairy.cabinet.Cabinet;
import com.toothfairy.cabinet.CabinetRepository;
import com.toothfairy.clinic_admin.ClinicAccount;
import com.toothfairy.clinic_admin.ClinicAccountRepository;
import com.toothfairy.clinic_admin.DentistJoinRequest;
import com.toothfairy.clinic_admin.DentistJoinRequestRepository;
import com.toothfairy.clinic_admin.dto.ClinicAuthResponse;
import com.toothfairy.patient_auth.PatientAccount;
import com.toothfairy.patient_auth.PatientAccountRepository;
import com.toothfairy.patient_auth.PatientJwtService;
import com.toothfairy.patient_auth.dto.PatientAuthResponse;
import com.toothfairy.stripe.StripeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final CabinetRepository            cabinetRepository;
    private final ClinicAccountRepository      clinicAccountRepository;
    private final DentistJoinRequestRepository joinRequestRepository;
    private final PatientAccountRepository     patientAccountRepository;
    private final PasswordEncoder              passwordEncoder;
    private final JwtService                   jwtService;
    private final PatientJwtService            patientJwtService;
    private final StripeService                stripeService;

    public AuthResponse register(RegisterRequest req) {
        if (cabinetRepository.existsByEmail(req.getEmail().toLowerCase().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Există deja un cont cu acest email");
        }

        boolean joiningClinic = req.getClinicEmail() != null && !req.getClinicEmail().isBlank();
        if (!joiningClinic) {
            if (req.getCabinetName() == null || req.getCabinetName().isBlank())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Numele cabinetului este obligatoriu");
            if (req.getPhone() == null || req.getPhone().isBlank())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Telefonul este obligatoriu");
        }

        String cabinetName = (req.getCabinetName() != null && !req.getCabinetName().isBlank())
                ? req.getCabinetName()
                : "Dr. " + req.getFirstName() + " " + req.getLastName();

        Cabinet cabinet = Cabinet.builder()
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .name(cabinetName)
                .email(req.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(req.getPassword()))
                .phone(req.getPhone())
                .plan(req.getPlan() != null ? req.getPlan() : "starter")
                .smsCredits(50)
                .build();

        cabinet = cabinetRepository.save(cabinet);

        // Determinăm paymentMethodId: din embedded form sau din Stripe Checkout Session
        String paymentMethodId = req.getPaymentMethodId();
        if ((paymentMethodId == null || paymentMethodId.isBlank())
                && req.getStripeSessionId() != null && !req.getStripeSessionId().isBlank()) {
            try {
                paymentMethodId = stripeService.getPaymentMethodFromSession(req.getStripeSessionId());
            } catch (Exception e) {
                cabinetRepository.delete(cabinet);
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Sesiune Stripe invalidă: " + e.getMessage());
            }
        }

        if (paymentMethodId != null && !paymentMethodId.isBlank()) {
            try {
                stripeService.createCustomerAndSubscribe(cabinet, paymentMethodId);
                cabinet = cabinetRepository.save(cabinet);
            } catch (Exception e) {
                cabinetRepository.delete(cabinet);
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Eroare procesare card: " + e.getMessage());
            }
        }

        // Cerere de alăturare la clinică (opțional)
        final Cabinet savedCabinet = cabinet;
        if (req.getClinicEmail() != null && !req.getClinicEmail().isBlank()) {
            clinicAccountRepository.findByEmail(req.getClinicEmail().toLowerCase().trim())
                    .ifPresent(clinic -> joinRequestRepository.save(
                            DentistJoinRequest.builder()
                                    .cabinetId(savedCabinet.getId())
                                    .clinicAccountId(clinic.getId())
                                    .build()));
        }

        String token = jwtService.generateToken(cabinet.getId(), cabinet.getEmail(), cabinet.getPlan());
        return toAuthResponse(token, cabinet);
    }

    public AuthResponse login(LoginRequest req) {
        Cabinet cabinet = cabinetRepository
                .findByEmail(req.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Email sau parolă incorectă"));

        if (!passwordEncoder.matches(req.getPassword(), cabinet.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Email sau parolă incorectă");
        }

        String token = jwtService.generateToken(cabinet.getId(), cabinet.getEmail(), cabinet.getPlan());
        return toAuthResponse(token, cabinet);
    }

    public UnifiedLoginResponse unifiedLogin(LoginRequest req) {
        String email    = req.getEmail().toLowerCase().trim();
        String password = req.getPassword();

        // 1. Cabinet (dentist)
        var cabinet = cabinetRepository.findByEmail(email);
        if (cabinet.isPresent() && passwordEncoder.matches(password, cabinet.get().getPassword())) {
            Cabinet c     = cabinet.get();
            String  token = jwtService.generateToken(c.getId(), c.getEmail(), c.getPlan());
            return UnifiedLoginResponse.builder()
                    .type("dentist").token(token)
                    .cabinet(toCabinetInfo(c))
                    .build();
        }

        // 2. Clinic admin
        var clinic = clinicAccountRepository.findByEmail(email);
        if (clinic.isPresent() && passwordEncoder.matches(password, clinic.get().getPassword())) {
            ClinicAccount ca = clinic.get();
            String token     = jwtService.generateClinicToken(ca.getId(), ca.getEmail());
            return UnifiedLoginResponse.builder()
                    .type("clinic").token(token)
                    .clinic(ClinicAuthResponse.ClinicInfo.builder()
                            .id(ca.getId()).name(ca.getName()).email(ca.getEmail())
                            .phone(ca.getPhone()).city(ca.getCity())
                            .address(ca.getAddress()).description(ca.getDescription())
                            .build())
                    .build();
        }

        // 3. Patient
        var patient = patientAccountRepository.findByEmail(email);
        if (patient.isPresent() && passwordEncoder.matches(password, patient.get().getPassword())) {
            PatientAccount pa = patient.get();
            String token      = patientJwtService.generateToken(pa.getId(), pa.getEmail());
            return UnifiedLoginResponse.builder()
                    .type("patient").token(token)
                    .patient(PatientAuthResponse.PatientInfo.builder()
                            .id(pa.getId()).firstName(pa.getFirstName()).lastName(pa.getLastName())
                            .email(pa.getEmail()).phone(pa.getPhone())
                            .build())
                    .build();
        }

        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email sau parolă incorectă");
    }

    private AuthResponse.CabinetInfo toCabinetInfo(Cabinet c) {
        return AuthResponse.CabinetInfo.builder()
                .id(c.getId()).firstName(c.getFirstName()).lastName(c.getLastName())
                .name(c.getName()).email(c.getEmail()).phone(c.getPhone())
                .city(c.getCity()).address(c.getAddress()).description(c.getDescription())
                .slug(c.getSlug()).website(c.getWebsite()).specialties(c.getSpecialties())
                .languages(c.getLanguages()).plan(c.getPlan()).smsCredits(c.getSmsCredits())
                .rating(c.getRating()).reviewCount(c.getReviewCount())
                .profilePhoto(c.getProfilePhoto()).coverPhoto(c.getCoverPhoto())
                .build();
    }

    private AuthResponse toAuthResponse(String token, Cabinet c) {
        return AuthResponse.builder()
                .token(token)
                .cabinet(toCabinetInfo(c))
                .build();
    }
}
