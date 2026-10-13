package com.toothfairy.patient_auth;

import com.toothfairy.patient_auth.dto.PatientAuthResponse;
import com.toothfairy.patient_auth.dto.PatientBookingResponse;
import com.toothfairy.patient_auth.dto.PatientLoginRequest;
import com.toothfairy.patient_auth.dto.PatientRegisterRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/patient-auth")
@RequiredArgsConstructor
public class PatientAuthController {

    private final PatientAuthService   patientAuthService;
    private final PatientJwtService    patientJwtService;

    // ── POST /api/patient-auth/register ──────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<PatientAuthResponse> register(
            @Valid @RequestBody PatientRegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(patientAuthService.register(request));
    }

    // ── POST /api/patient-auth/login ─────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<PatientAuthResponse> login(
            @Valid @RequestBody PatientLoginRequest request) {
        return ResponseEntity.ok(patientAuthService.login(request));
    }

    // ── GET /api/patient-auth/me ─────────────────────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(
            @RequestHeader("Authorization") String authHeader) {
        UUID patientAccountId = extractPatientId(authHeader);
        PatientAccount account = patientAuthService.getAccount(patientAccountId);
        return ResponseEntity.ok(Map.of(
                "id",        account.getId(),
                "firstName", account.getFirstName(),
                "lastName",  account.getLastName(),
                "email",     account.getEmail(),
                "phone",     account.getPhone()
        ));
    }

    // ── GET /api/patient-auth/bookings ───────────────────────────────────────
    @GetMapping("/bookings")
    public ResponseEntity<List<PatientBookingResponse>> getBookings(
            @RequestHeader("Authorization") String authHeader) {
        UUID patientAccountId = extractPatientId(authHeader);
        return ResponseEntity.ok(patientAuthService.getBookings(patientAccountId));
    }

    // ── PUT /api/patient-auth/bookings/{id}/cancel ───────────────────────────
    @PutMapping("/bookings/{id}/cancel")
    public ResponseEntity<Map<String, String>> cancelBooking(
            @PathVariable UUID id,
            @RequestHeader("Authorization") String authHeader) {
        UUID patientAccountId = extractPatientId(authHeader);
        patientAuthService.cancelBooking(id, patientAccountId);
        return ResponseEntity.ok(Map.of("message", "Programare anulată"));
    }

    // ── Helper: extract + validate patient JWT from header ───────────────────
    private UUID extractPatientId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token lipsă");
        }
        String token = authHeader.substring(7);
        if (!patientJwtService.isTokenValid(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token invalid sau expirat");
        }
        return patientJwtService.extractPatientAccountId(token);
    }
}
