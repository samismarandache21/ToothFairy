package com.toothfairy.clinic_admin;

import com.toothfairy.auth.JwtService;
import com.toothfairy.clinic_admin.dto.ClinicAuthResponse;
import com.toothfairy.clinic_admin.dto.ClinicLoginRequest;
import com.toothfairy.clinic_admin.dto.ClinicRegisterRequest;
import com.toothfairy.stripe.StripeClinicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/clinic-auth")
@RequiredArgsConstructor
public class ClinicAuthController {

    private final ClinicAccountRepository clinicAccountRepository;
    private final PasswordEncoder         passwordEncoder;
    private final JwtService              jwtService;
    private final StripeClinicService     stripeClinicService;

    @PostMapping("/register")
    public ResponseEntity<ClinicAuthResponse> register(@RequestBody ClinicRegisterRequest req) {
        String email = req.getEmail().toLowerCase().trim();
        if (clinicAccountRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Există deja un cont de clinică cu acest email");
        }

        ClinicAccount clinic = ClinicAccount.builder()
                .name(req.getName())
                .email(email)
                .password(passwordEncoder.encode(req.getPassword()))
                .phone(req.getPhone())
                .city(req.getCity())
                .address(req.getAddress())
                .build();

        clinic = clinicAccountRepository.save(clinic);

        String paymentMethodId = req.getPaymentMethodId();
        if ((paymentMethodId == null || paymentMethodId.isBlank())
                && req.getStripeSessionId() != null && !req.getStripeSessionId().isBlank()) {
            try {
                paymentMethodId = stripeClinicService.getPaymentMethodFromSession(req.getStripeSessionId());
            } catch (Exception e) {
                clinicAccountRepository.delete(clinic);
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Sesiune Stripe invalidă: " + e.getMessage());
            }
        }

        if (paymentMethodId != null && !paymentMethodId.isBlank()) {
            try {
                stripeClinicService.createCustomerAndSubscribe(clinic, paymentMethodId);
                clinic = clinicAccountRepository.save(clinic);
            } catch (Exception e) {
                clinicAccountRepository.delete(clinic);
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Eroare procesare card: " + e.getMessage());
            }
        }

        String token = jwtService.generateClinicToken(clinic.getId(), clinic.getEmail());
        return ResponseEntity.ok(toResponse(token, clinic));
    }

    @PostMapping("/login")
    public ResponseEntity<ClinicAuthResponse> login(@RequestBody ClinicLoginRequest req) {
        String email = req.getEmail().toLowerCase().trim();
        ClinicAccount clinic = clinicAccountRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Email sau parolă incorectă"));

        if (!passwordEncoder.matches(req.getPassword(), clinic.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email sau parolă incorectă");
        }

        String token = jwtService.generateClinicToken(clinic.getId(), clinic.getEmail());
        return ResponseEntity.ok(toResponse(token, clinic));
    }

    private ClinicAuthResponse toResponse(String token, ClinicAccount c) {
        return ClinicAuthResponse.builder()
                .token(token)
                .clinic(ClinicAuthResponse.ClinicInfo.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .email(c.getEmail())
                        .phone(c.getPhone())
                        .city(c.getCity())
                        .address(c.getAddress())
                        .description(c.getDescription())
                        .build())
                .build();
    }
}
