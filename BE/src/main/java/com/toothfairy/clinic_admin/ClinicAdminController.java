package com.toothfairy.clinic_admin;

import com.toothfairy.appointment.AppointmentRepository;
import com.toothfairy.cabinet.Cabinet;
import com.toothfairy.cabinet.CabinetRepository;
import com.toothfairy.common.SecurityUtils;
import com.toothfairy.patient.PatientRepository;
import com.toothfairy.stripe.StripeClinicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@RestController
@RequestMapping("/api/clinic")
@RequiredArgsConstructor
public class ClinicAdminController {

    private final ClinicAccountRepository      clinicAccountRepository;
    private final CabinetRepository            cabinetRepository;
    private final DentistJoinRequestRepository joinRequestRepository;
    private final AppointmentRepository        appointmentRepository;
    private final PatientRepository            patientRepository;
    private final SecurityUtils                securityUtils;
    private final StripeClinicService          stripeClinicService;

    // ── GET /clinic/me ────────────────────────────────────────────────────────

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMe() {
        UUID clinicId = securityUtils.getCurrentClinicId();
        ClinicAccount clinic = clinicAccountRepository.findById(clinicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clinică negăsită"));

        List<Cabinet> members = cabinetRepository.findByClinicAccountId(clinicId);

        int dentistCount   = members.size();
        int basePrice      = 150;
        int extraDentists  = Math.max(0, dentistCount - 3);
        int monthlyTotal   = basePrice + extraDentists * 50;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id",           clinic.getId());
        result.put("name",         clinic.getName());
        result.put("email",        clinic.getEmail());
        result.put("phone",        clinic.getPhone());
        result.put("city",         clinic.getCity());
        result.put("address",      clinic.getAddress());
        result.put("description",  clinic.getDescription());
        result.put("dentistCount", dentistCount);
        result.put("monthlyTotal", monthlyTotal);
        result.put("createdAt",    clinic.getCreatedAt());
        return ResponseEntity.ok(result);
    }

    // ── PUT /clinic/me ────────────────────────────────────────────────────────

    @PutMapping("/me")
    public ResponseEntity<Map<String, Object>> updateMe(@RequestBody Map<String, String> body) {
        UUID clinicId = securityUtils.getCurrentClinicId();
        ClinicAccount clinic = clinicAccountRepository.findById(clinicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clinică negăsită"));

        if (body.containsKey("name"))        clinic.setName(body.get("name").trim());
        if (body.containsKey("phone"))       clinic.setPhone(body.get("phone").trim());
        if (body.containsKey("city"))        clinic.setCity(body.get("city").trim());
        if (body.containsKey("address"))     clinic.setAddress(body.get("address").trim());
        if (body.containsKey("description")) clinic.setDescription(body.get("description").trim());
        clinicAccountRepository.save(clinic);

        return getMe();
    }

    // ── GET /clinic/me/stats ──────────────────────────────────────────────────

    @GetMapping("/me/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        UUID clinicId = securityUtils.getCurrentClinicId();
        List<Cabinet> members = cabinetRepository.findByClinicAccountId(clinicId);

        LocalDateTime now        = LocalDateTime.now();
        LocalDateTime monthStart = now.with(TemporalAdjusters.firstDayOfMonth()).toLocalDate().atStartOfDay();
        LocalDateTime monthEnd   = now.with(TemporalAdjusters.firstDayOfNextMonth()).toLocalDate().atStartOfDay();
        LocalDateTime prevStart  = monthStart.minusMonths(1);

        long totalAppts     = 0;
        long prevTotalAppts = 0;
        long totalNoShows   = 0;
        long totalPatients  = 0;
        long prevPatients   = 0;

        List<Map<String, Object>> dentistStats = new ArrayList<>();

        for (Cabinet c : members) {
            UUID cid = c.getId();
            long appts    = appointmentRepository.countByRange(cid, monthStart, monthEnd);
            long noShows  = appointmentRepository.countNoShows(cid, monthStart, monthEnd);
            long patients = patientRepository.countNewPatients(cid, monthStart, monthEnd);
            long prevAppts = appointmentRepository.countByRange(cid, prevStart, monthStart);

            totalAppts     += appts;
            prevTotalAppts += prevAppts;
            totalNoShows   += noShows;
            totalPatients  += patients;
            prevPatients   += patientRepository.countNewPatients(cid, prevStart, monthStart);

            Map<String, Object> ds = new LinkedHashMap<>();
            ds.put("id",           c.getId());
            ds.put("firstName",    c.getFirstName());
            ds.put("lastName",     c.getLastName());
            ds.put("name",         c.getName());
            ds.put("slug",         c.getSlug());
            ds.put("specialty",    c.getSpecialties());
            ds.put("rating",       c.getRating());
            ds.put("reviewCount",  c.getReviewCount());
            ds.put("profilePhoto", c.getProfilePhoto());
            ds.put("appointments", appts);
            ds.put("noShows",      noShows);
            ds.put("newPatients",  patients);
            dentistStats.add(ds);
        }

        String apptsTrend   = prevTotalAppts > 0
                ? String.format("%+.0f%%", ((double)(totalAppts - prevTotalAppts) / prevTotalAppts) * 100)
                : String.valueOf(totalAppts);
        String patientsTrend = prevPatients > 0
                ? String.format("%+d", totalPatients - prevPatients)
                : String.valueOf(totalPatients);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalAppointments", totalAppts);
        result.put("appointmentsTrend", apptsTrend);
        result.put("totalNoShows",      totalNoShows);
        result.put("totalNewPatients",  totalPatients);
        result.put("patientsTrend",     patientsTrend);
        result.put("dentistCount",      members.size());
        result.put("dentistStats",      dentistStats);
        return ResponseEntity.ok(result);
    }

    // ── GET /clinic/me/dentists ───────────────────────────────────────────────

    @GetMapping("/me/dentists")
    public ResponseEntity<List<Map<String, Object>>> getDentists() {
        UUID clinicId = securityUtils.getCurrentClinicId();
        List<Cabinet> members = cabinetRepository.findByClinicAccountId(clinicId);

        List<Map<String, Object>> result = members.stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",           c.getId());
            m.put("firstName",    c.getFirstName());
            m.put("lastName",     c.getLastName());
            m.put("name",         c.getName());
            m.put("slug",         c.getSlug());
            m.put("email",        c.getEmail());
            m.put("phone",        c.getPhone());
            m.put("specialties",  c.getSpecialties());
            m.put("rating",       c.getRating());
            m.put("reviewCount",  c.getReviewCount());
            m.put("profilePhoto", c.getProfilePhoto());
            m.put("plan",         c.getPlan());
            m.put("joinedAt",     c.getCreatedAt());
            return m;
        }).toList();

        return ResponseEntity.ok(result);
    }

    // ── GET /clinic/me/requests ───────────────────────────────────────────────

    @GetMapping("/me/requests")
    public ResponseEntity<List<Map<String, Object>>> getRequests() {
        UUID clinicId = securityUtils.getCurrentClinicId();
        List<DentistJoinRequest> requests =
                joinRequestRepository.findByClinicAccountIdOrderByRequestedAtDesc(clinicId);

        List<Map<String, Object>> result = requests.stream().map(r -> {
            Cabinet cab = cabinetRepository.findById(r.getCabinetId()).orElse(null);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",          r.getId());
            m.put("status",      r.getStatus());
            m.put("message",     r.getMessage());
            m.put("requestedAt", r.getRequestedAt());
            m.put("resolvedAt",  r.getResolvedAt());
            if (cab != null) {
                m.put("dentistId",        cab.getId());
                m.put("dentistFirstName", cab.getFirstName());
                m.put("dentistLastName",  cab.getLastName());
                m.put("dentistName",      cab.getName());
                m.put("dentistEmail",     cab.getEmail());
                m.put("dentistPhone",     cab.getPhone());
                m.put("dentistSpecialties", cab.getSpecialties());
                m.put("dentistRating",    cab.getRating());
                m.put("dentistProfilePhoto", cab.getProfilePhoto());
            }
            return m;
        }).toList();

        return ResponseEntity.ok(result);
    }

    // ── PUT /clinic/me/requests/{id}/approve ─────────────────────────────────

    @PutMapping("/me/requests/{id}/approve")
    public ResponseEntity<Void> approveRequest(@PathVariable UUID id) {
        UUID clinicId = securityUtils.getCurrentClinicId();
        DentistJoinRequest req = joinRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cerere negăsită"));

        if (!req.getClinicAccountId().equals(clinicId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acces interzis");
        }
        if (!"PENDING".equals(req.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cererea nu este în așteptare");
        }

        req.setStatus("APPROVED");
        req.setResolvedAt(LocalDateTime.now());
        joinRequestRepository.save(req);

        ClinicAccount clinic = clinicAccountRepository.findById(clinicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clinică negăsită"));

        Cabinet cabinet = cabinetRepository.findById(req.getCabinetId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cabinet negăsit"));
        cabinet.setClinicAccountId(clinicId);
        // Preluăm datele de locație și telefon de la clinică
        if (clinic.getCity()    != null) cabinet.setCity(clinic.getCity());
        if (clinic.getAddress() != null) cabinet.setAddress(clinic.getAddress());
        if (clinic.getPhone()   != null) cabinet.setPhone(clinic.getPhone());
        cabinetRepository.save(cabinet);

        int newCount = cabinetRepository.findByClinicAccountId(clinicId).size();
        try { stripeClinicService.updateSubscriptionAmount(clinic, newCount); }
        catch (Exception ignored) { /* Stripe optional — nu blocăm fluxul */ }

        return ResponseEntity.ok().build();
    }

    // ── PUT /clinic/me/requests/{id}/reject ──────────────────────────────────

    @PutMapping("/me/requests/{id}/reject")
    public ResponseEntity<Void> rejectRequest(@PathVariable UUID id) {
        UUID clinicId = securityUtils.getCurrentClinicId();
        DentistJoinRequest req = joinRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cerere negăsită"));

        if (!req.getClinicAccountId().equals(clinicId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acces interzis");
        }

        req.setStatus("REJECTED");
        req.setResolvedAt(LocalDateTime.now());
        joinRequestRepository.save(req);

        return ResponseEntity.ok().build();
    }

    // ── DELETE /clinic/me/dentists/{cabinetId} ────────────────────────────────

    @DeleteMapping("/me/dentists/{cabinetId}")
    public ResponseEntity<Void> removeDentist(@PathVariable UUID cabinetId) {
        UUID clinicId = securityUtils.getCurrentClinicId();
        Cabinet cabinet = cabinetRepository.findById(cabinetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cabinet negăsit"));

        if (!clinicId.equals(cabinet.getClinicAccountId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acces interzis");
        }

        cabinet.setClinicAccountId(null);
        cabinet.setActive(false);
        cabinetRepository.save(cabinet);

        ClinicAccount clinic = clinicAccountRepository.findById(clinicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clinică negăsită"));
        int newCount = cabinetRepository.findByClinicAccountId(clinicId).size();
        try { stripeClinicService.updateSubscriptionAmount(clinic, newCount); }
        catch (Exception ignored) { /* Stripe optional — nu blocăm fluxul */ }

        return ResponseEntity.ok().build();
    }
}
