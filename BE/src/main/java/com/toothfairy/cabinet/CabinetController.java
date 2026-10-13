package com.toothfairy.cabinet;

import com.toothfairy.clinic_admin.ClinicAccountRepository;
import com.toothfairy.clinic_admin.DentistJoinRequest;
import com.toothfairy.clinic_admin.DentistJoinRequestRepository;
import com.toothfairy.common.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/cabinet")
@RequiredArgsConstructor
public class CabinetController {

    private final CabinetService               cabinetService;
    private final SecurityUtils                securityUtils;
    private final ClinicAccountRepository      clinicAccountRepository;
    private final DentistJoinRequestRepository joinRequestRepository;

    @GetMapping("/me")
    public ResponseEntity<CabinetResponse> getMe() {
        return ResponseEntity.ok(cabinetService.getMe());
    }

    @PutMapping("/me")
    public ResponseEntity<CabinetResponse> updateMe(@RequestBody CabinetUpdateRequest request) {
        return ResponseEntity.ok(cabinetService.updateMe(request));
    }

    @PutMapping("/me/cover-photo")
    public ResponseEntity<Void> updateCoverPhoto(@RequestBody Map<String, String> body) {
        cabinetService.updateCoverPhoto(body.get("coverPhoto"));
        return ResponseEntity.ok().build();
    }

    @PutMapping("/me/profile-photo")
    public ResponseEntity<Void> updateProfilePhoto(@RequestBody Map<String, String> body) {
        cabinetService.updateProfilePhoto(body.get("profilePhoto"));
        return ResponseEntity.ok().build();
    }

    /**
     * GET /api/cabinet/my-clinic
     * Returnează info clinică dacă medicul face parte dintr-una, altfel 404.
     */
    @GetMapping("/my-clinic")
    public ResponseEntity<?> getMyClinic() {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        Cabinet cabinet = cabinetService.getCabinetById(cabinetId);
        if (cabinet.getClinicAccountId() == null) {
            return ResponseEntity.notFound().build();
        }
        return clinicAccountRepository.findById(cabinet.getClinicAccountId())
                .map(ca -> ResponseEntity.ok(java.util.Map.of(
                        "id",      ca.getId(),
                        "name",    ca.getName(),
                        "email",   ca.getEmail(),
                        "phone",   ca.getPhone() != null ? ca.getPhone() : "",
                        "city",    ca.getCity()  != null ? ca.getCity()  : "",
                        "address", ca.getAddress() != null ? ca.getAddress() : ""
                )))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * POST /api/cabinet/join-request
     * Body: { "clinicName": "Clinica Dent Pro", "clinicEmail": "contact@clinica.ro", "message": "..." }
     * Dentistul autentificat trimite o cerere de alăturare la clinica identificată prin email și nume.
     */
    @PostMapping("/join-request")
    public ResponseEntity<Void> sendJoinRequest(@RequestBody Map<String, String> body) {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        String clinicEmail = body.get("clinicEmail");
        if (clinicEmail == null || clinicEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email clinică lipsă");
        }

        UUID clinicId = clinicAccountRepository.findByEmail(clinicEmail.toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Nu există nicio clinică înregistrată cu acest email"))
                .getId();

        boolean alreadyPending = joinRequestRepository
                .existsByCabinetIdAndClinicAccountIdAndStatus(cabinetId, clinicId, "PENDING");
        if (alreadyPending) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ai deja o cerere în așteptare pentru această clinică");
        }

        DentistJoinRequest req = DentistJoinRequest.builder()
                .cabinetId(cabinetId)
                .clinicAccountId(clinicId)
                .message(body.getOrDefault("message", ""))
                .build();
        joinRequestRepository.save(req);

        return ResponseEntity.ok().build();
    }

    /**
     * GET /api/cabinet/my-join-requests
     * Returnează cererile de alăturare ale medicului curent.
     */
    @GetMapping("/my-join-requests")
    public ResponseEntity<java.util.List<java.util.Map<String, Object>>> getMyJoinRequests() {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        var requests = joinRequestRepository.findByCabinetId(cabinetId);

        var result = requests.stream().map(r -> {
            var m = new java.util.LinkedHashMap<String, Object>();
            m.put("id",          r.getId());
            m.put("status",      r.getStatus());
            m.put("requestedAt", r.getRequestedAt());
            m.put("resolvedAt",  r.getResolvedAt());
            clinicAccountRepository.findById(r.getClinicAccountId()).ifPresent(c -> {
                m.put("clinicName",  c.getName());
                m.put("clinicEmail", c.getEmail());
                m.put("clinicCity",  c.getCity());
            });
            return (java.util.Map<String, Object>) m;
        }).toList();

        return ResponseEntity.ok(result);
    }
}
