package com.toothfairy.public_portal;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.toothfairy.appointment.Appointment;
import com.toothfairy.appointment.AppointmentRepository;
import com.toothfairy.breaks.Break;
import com.toothfairy.breaks.BreakRepository;
import com.toothfairy.cabinet.Cabinet;
import com.toothfairy.cabinet.CabinetRepository;
import com.toothfairy.clinic_admin.ClinicAccount;
import com.toothfairy.clinic_admin.ClinicAccountRepository;
import com.toothfairy.patient.Patient;
import com.toothfairy.patient.PatientRepository;
import com.toothfairy.review.Review;
import com.toothfairy.review.ReviewRepository;
import com.toothfairy.service.TreatmentType;
import com.toothfairy.service.TreatmentTypeRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final CabinetRepository       cabinetRepository;
    private final ClinicAccountRepository  clinicAccountRepository;
    private final TreatmentTypeRepository treatmentTypeRepository;
    private final AppointmentRepository   appointmentRepository;
    private final PatientRepository       patientRepository;
    private final ReviewRepository        reviewRepository;
    private final BreakRepository         breakRepository;
    private final ObjectMapper            objectMapper;

    // Romanian day names indexed by DayOfWeek.getValue() (1=Mon … 7=Sun)
    private static final String[] RO_DAYS =
        {"Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"};

    // ── GET /api/public/cabinets ─────────────────────────────────────────────
    @GetMapping("/cabinets")
    public ResponseEntity<List<Map<String, Object>>> getCabinets() {
        List<Cabinet> cabinets = cabinetRepository.findAllByActiveTrueOrderByRatingDesc();

        // Pre-load all referenced clinics in one query to avoid N+1
        Set<UUID> clinicIds = cabinets.stream()
                .map(Cabinet::getClinicAccountId)
                .filter(Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());
        Map<UUID, ClinicAccount> clinicMap = clinicIds.isEmpty()
                ? Collections.emptyMap()
                : clinicAccountRepository.findAllById(clinicIds).stream()
                        .collect(java.util.stream.Collectors.toMap(ClinicAccount::getId, c -> c));

        List<Map<String, Object>> result = cabinets.stream()
                .map(c -> {
                    // Use clinic's location if the cabinet belongs to one
                    ClinicAccount clinic = c.getClinicAccountId() != null
                            ? clinicMap.get(c.getClinicAccountId()) : null;
                    String city    = clinic != null && clinic.getCity()    != null ? clinic.getCity()    : (c.getCity()    != null ? c.getCity()    : "");
                    String address = clinic != null && clinic.getAddress() != null ? clinic.getAddress() : (c.getAddress() != null ? c.getAddress() : "");
                    String phone   = clinic != null && clinic.getPhone()   != null ? clinic.getPhone()   : (c.getPhone()   != null ? c.getPhone()   : "");
                    String email   = clinic != null && clinic.getEmail()   != null ? clinic.getEmail()   : (c.getEmail()   != null ? c.getEmail()   : "");

                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id",            c.getId());
                    m.put("name",          c.getName());
                    m.put("slug",          (c.getSlug() != null && !c.getSlug().isBlank()) ? c.getSlug() : c.getId().toString());
                    m.put("city",          city);
                    m.put("address",       address);
                    m.put("phone",         phone);
                    m.put("email",         email);
                    m.put("firstName",     c.getFirstName()   != null ? c.getFirstName()   : "");
                    m.put("lastName",      c.getLastName()    != null ? c.getLastName()    : "");
                    m.put("description",   c.getDescription() != null ? c.getDescription() : "");
                    m.put("specialties",   c.getSpecialties() != null ? c.getSpecialties() : "[]");
                    m.put("coverPhoto",    c.getCoverPhoto());
                    m.put("profilePhoto",  c.getProfilePhoto());
                    m.put("rating",        c.getRating());
                    m.put("reviewCount",   c.getReviewCount());
                    m.put("plan",          c.getPlan());
                    m.put("clinicAccountId", c.getClinicAccountId());

                    // Servicii — doar id+name+price pentru filtrare în explorer
                    List<Map<String, Object>> svcs = treatmentTypeRepository
                            .findByCabinetId(c.getId())
                            .stream()
                            .map(s -> {
                                Map<String, Object> sm = new LinkedHashMap<>();
                                sm.put("id",    s.getId());
                                sm.put("name",  s.getName());
                                sm.put("price", s.getPrice());
                                return sm;
                            })
                            .toList();
                    m.put("services", svcs);

                    return m;
                })
                .toList();
        return ResponseEntity.ok(result);
    }

    // ── GET /api/public/cabinet/{slug} ───────────────────────────────────────
    @GetMapping("/cabinet/{slug}")
    public ResponseEntity<Map<String, Object>> getCabinet(@PathVariable String slug) {
        Cabinet cabinet = findBySlug(slug);

        List<Map<String, Object>> services = treatmentTypeRepository
                .findByCabinetId(cabinet.getId())
                .stream()
                .map(s -> {
                    Map<String, Object> sm = new LinkedHashMap<>();
                    sm.put("id",                    s.getId());
                    sm.put("name",                  s.getName());
                    sm.put("durationMinutes",        s.getDurationMinutes() != null ? s.getDurationMinutes() : 30);
                    sm.put("price",                  s.getPrice());
                    sm.put("color",                  s.getColor());
                    sm.put("isConsultation",         s.getIsConsultation() != null && s.getIsConsultation());
                    sm.put("requiresConsultForNew",  s.getRequiresConsultForNew() != null && s.getRequiresConsultForNew());
                    return sm;
                })
                .toList();

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id",           cabinet.getId());
        data.put("name",         cabinet.getName());
        data.put("slug",         (cabinet.getSlug() != null && !cabinet.getSlug().isBlank()) ? cabinet.getSlug() : cabinet.getId().toString());
        data.put("firstName",    cabinet.getFirstName()   != null ? cabinet.getFirstName()   : "");
        data.put("lastName",     cabinet.getLastName()    != null ? cabinet.getLastName()    : "");
        data.put("email",        cabinet.getEmail());
        data.put("phone",        cabinet.getPhone()       != null ? cabinet.getPhone()       : "");
        data.put("city",         cabinet.getCity()        != null ? cabinet.getCity()        : "");
        data.put("address",      cabinet.getAddress()     != null ? cabinet.getAddress()     : "");
        data.put("description",  cabinet.getDescription() != null ? cabinet.getDescription() : "");
        data.put("website",      cabinet.getWebsite()     != null ? cabinet.getWebsite()     : "");
        data.put("specialties",  cabinet.getSpecialties() != null ? cabinet.getSpecialties() : "[]");
        data.put("languages",    cabinet.getLanguages()   != null ? cabinet.getLanguages()   : "[]");
        data.put("workingHours", cabinet.getWorkingHours());
        data.put("coverPhoto",   cabinet.getCoverPhoto());
        data.put("profilePhoto", cabinet.getProfilePhoto());
        data.put("rating",       cabinet.getRating());
        data.put("reviewCount",  cabinet.getReviewCount());
        data.put("services",     services);
        return ResponseEntity.ok(data);
    }

    // ── GET /api/public/cabinet/{slug}/slots ─────────────────────────────────
    @GetMapping("/cabinet/{slug}/slots")
    public ResponseEntity<List<String>> getSlots(
            @PathVariable String slug,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Integer durationMinutes) {

        Cabinet cabinet = findBySlug(slug);
        int duration = (durationMinutes != null && durationMinutes > 0) ? durationMinutes : 30;

        // Determine working hours for the requested day from cabinet's workingHours JSON.
        // Falls back to 08:00–18:00 Mon–Fri / closed weekends if no schedule is saved.
        int javaDow = date.getDayOfWeek().getValue(); // 1=Mon … 7=Sun
        String dayName = RO_DAYS[javaDow - 1];

        LocalTime workStart = LocalTime.of(8, 0);
        LocalTime workEnd   = LocalTime.of(18, 0);
        boolean dayOpen = javaDow <= 5; // default: Mon–Fri open, Sat–Sun closed

        String wh = cabinet.getWorkingHours();
        if (wh != null && !wh.isBlank() && !wh.equals("null")) {
            try {
                JsonNode arr = objectMapper.readTree(wh);
                for (JsonNode node : arr) {
                    if (dayName.equals(node.path("day").asText())) {
                        dayOpen = node.path("open").asBoolean(dayOpen);
                        if (dayOpen) {
                            String startStr = node.path("start").asText("08:00");
                            String endStr   = node.path("end").asText("18:00");
                            workStart = LocalTime.parse(startStr);
                            workEnd   = LocalTime.parse(endStr);
                        }
                        break;
                    }
                }
            } catch (Exception ignored) {
                // keep defaults
            }
        }

        if (!dayOpen) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        // Collect busy intervals from all non-cancelled appointments
        List<LocalTime[]> busyIntervals = appointmentRepository
                .findByDay(cabinet.getId(), date.atStartOfDay(), date.atTime(LocalTime.MAX))
                .stream()
                .filter(a -> !"cancelled".equals(a.getStatus()))
                .map(a -> new LocalTime[]{
                    a.getStartTime().toLocalTime(),
                    a.getEndTime().toLocalTime()
                })
                .toList();

        // Collect blocked ranges from recurring breaks
        int dom = date.getDayOfMonth();
        List<Break> breaks = breakRepository.findByCabinetId(cabinet.getId());
        List<LocalTime[]> blockedRanges = breaks.stream()
                .filter(b -> switch (b.getRecurrenceType()) {
                    case "DAILY"   -> true;
                    case "WEEKLY"  -> b.getDayOfWeek() != null && b.getDayOfWeek() == javaDow;
                    case "MONTHLY" -> b.getDayOfMonth() != null && b.getDayOfMonth() == dom;
                    case "NONE"    -> b.getDate() != null && b.getDate().equals(date);
                    default        -> false;
                })
                .map(b -> new LocalTime[]{ b.getStartTime(), b.getStartTime().plusMinutes(b.getDurationMinutes()) })
                .toList();

        // Use minute-of-day arithmetic to avoid LocalTime midnight wrap-around.
        // e.g. 19:30 + 285 min wraps to 00:15 as LocalTime, which isAfter(20:00) = false — wrong.
        int workStartMin = workStart.getHour() * 60 + workStart.getMinute();
        int workEndMin   = workEnd.getHour()   * 60 + workEnd.getMinute();

        List<String> available = new ArrayList<>();
        int cursorMin = workStartMin;
        while (cursorMin < workEndMin) {
            final int slotStartMin = cursorMin;
            final int slotEndMin   = cursorMin + duration;

            if (slotEndMin <= workEndMin) {
                final LocalTime slotStart = LocalTime.of(slotStartMin / 60, slotStartMin % 60);
                final LocalTime slotEnd   = LocalTime.of(slotEndMin   / 60, slotEndMin   % 60);

                boolean blockedByBreak = blockedRanges.stream()
                        .anyMatch(r -> slotStart.isBefore(r[1]) && slotEnd.isAfter(r[0]));
                boolean blockedByAppt  = busyIntervals.stream()
                        .anyMatch(r -> slotStart.isBefore(r[1]) && slotEnd.isAfter(r[0]));

                if (!blockedByBreak && !blockedByAppt) {
                    available.add(String.format("%02d:%02d", slotStart.getHour(), slotStart.getMinute()));
                }
            }
            cursorMin += 30;
        }
        return ResponseEntity.ok(available);
    }

    // ── POST /api/public/cabinet/{slug}/book ─────────────────────────────────
    @PostMapping("/cabinet/{slug}/book")
    public ResponseEntity<Map<String, Object>> book(
            @PathVariable String slug,
            @Valid @RequestBody PublicBookingRequest request) {

        Cabinet cabinet = findBySlug(slug);

        Patient patient = patientRepository
                .findByCabinetIdAndPhone(cabinet.getId(), request.getPhone())
                .orElseGet(() -> {
                    Patient p = Patient.builder()
                            .cabinet(cabinet)
                            .firstName(request.getFirstName())
                            .lastName(request.getLastName())
                            .phone(request.getPhone())
                            .email(request.getEmail())
                            .build();
                    return patientRepository.save(p);
                });

        if (appointmentRepository.existsConflict(
                cabinet.getId(), request.getStartTime(), request.getEndTime(),
                new UUID(0, 0))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Intervalul orar nu mai este disponibil");
        }

        TreatmentType treatmentType = null;
        if (request.getTreatmentTypeId() != null) {
            treatmentType = treatmentTypeRepository
                    .findByIdAndCabinetId(request.getTreatmentTypeId(), cabinet.getId())
                    .orElse(null);
        }

        Appointment appt = Appointment.builder()
                .cabinet(cabinet)
                .patient(patient)
                .treatmentType(treatmentType)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status("confirmed")
                .notes(request.getNotes())
                .build();

        appointmentRepository.save(appt);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                Map.of("message",       "Programare confirmată cu succes",
                       "appointmentId", appt.getId()));
    }

    // ── GET /api/public/cabinet/{slug}/reviews ───────────────────────────────
    @Transactional(readOnly = true)
    @GetMapping("/cabinet/{slug}/reviews")
    public ResponseEntity<List<Map<String, Object>>> getReviews(@PathVariable String slug) {
        Cabinet cabinet = findBySlug(slug);
        List<Map<String, Object>> reviews = reviewRepository
                .findByCabinetIdOrderByCreatedAtDesc(cabinet.getId())
                .stream()
                .map(r -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id",     r.getId());
                    m.put("author", r.getAuthorName() != null ? r.getAuthorName() : "Pacient anonim");
                    m.put("rating", r.getRating());
                    m.put("text",   r.getText() != null ? r.getText() : "");
                    m.put("date",   r.getCreatedAt() != null
                            ? r.getCreatedAt().toLocalDate().toString() : "");
                    return m;
                })
                .toList();
        return ResponseEntity.ok(reviews);
    }

    // ── POST /api/public/cabinet/{slug}/review ───────────────────────────────
    @PostMapping("/cabinet/{slug}/review")
    public ResponseEntity<Map<String, Object>> submitReview(
            @PathVariable String slug,
            @Valid @RequestBody ReviewRequest request) {

        Cabinet cabinet = findBySlug(slug);

        if (request.getAppointmentId() != null
                && reviewRepository.existsByAppointmentId(request.getAppointmentId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ai lăsat deja o recenzie pentru această programare");
        }

        int count = cabinet.getReviewCount();
        BigDecimal newRating;
        if (count == 0) {
            newRating = BigDecimal.valueOf(request.getRating());
        } else {
            newRating = cabinet.getRating()
                    .multiply(BigDecimal.valueOf(count))
                    .add(BigDecimal.valueOf(request.getRating()))
                    .divide(BigDecimal.valueOf(count + 1), 2, RoundingMode.HALF_UP);
        }
        cabinet.setRating(newRating);
        cabinet.setReviewCount(count + 1);
        cabinetRepository.save(cabinet);

        reviewRepository.save(Review.builder()
                .cabinet(cabinet)
                .appointmentId(request.getAppointmentId())
                .authorName(request.getAuthorName())
                .rating(request.getRating())
                .text(request.getText())
                .build());

        return ResponseEntity.status(HttpStatus.CREATED).body(
                Map.of("message", "Recenzie trimisă cu succes"));
    }

    // ── Helper ───────────────────────────────────────────────────────────────
    private Cabinet findBySlug(String slug) {
        try {
            UUID id = UUID.fromString(slug);
            return cabinetRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cabinet negăsit"));
        } catch (IllegalArgumentException e) {
            return cabinetRepository.findBySlug(slug)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cabinet negăsit"));
        }
    }

    // ── Inner DTOs ────────────────────────────────────────────────────────────
    @Getter
    @Setter
    public static class PublicBookingRequest {
        @NotBlank private String firstName;
        @NotBlank private String lastName;
        @NotBlank private String phone;
        private String email;
        @NotNull  private LocalDateTime startTime;
        @NotNull  private LocalDateTime endTime;
        private UUID treatmentTypeId;
        private String notes;
    }

    @Getter
    @Setter
    public static class ReviewRequest {
        @NotNull private Integer rating;
        private String authorName;
        private String text;
        private UUID   appointmentId;
    }
}
