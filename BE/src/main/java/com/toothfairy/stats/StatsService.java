package com.toothfairy.stats;

import com.toothfairy.appointment.AppointmentRepository;
import com.toothfairy.cabinet.Cabinet;
import com.toothfairy.cabinet.CabinetRepository;
import com.toothfairy.common.SecurityUtils;
import com.toothfairy.patient.PatientRepository;
import com.toothfairy.service.TreatmentTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final AppointmentRepository   appointmentRepository;
    private final PatientRepository       patientRepository;
    private final TreatmentTypeRepository treatmentTypeRepository;
    private final CabinetRepository       cabinetRepository;
    private final SecurityUtils           securityUtils;

    public Map<String, Object> getDashboardStats() {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        Cabinet cabinet = cabinetRepository.findById(cabinetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cabinet negăsit"));

        LocalDateTime now = LocalDateTime.now();
        Locale ro = new Locale("ro", "RO");

        // ── Săptămâna curentă (Luni → Duminică) ──────────────────────────
        LocalDateTime weekStart = now.with(java.time.DayOfWeek.MONDAY).toLocalDate().atStartOfDay();
        LocalDateTime weekEnd   = weekStart.plusDays(7);
        LocalDateTime prevWeekStart = weekStart.minusWeeks(1);

        // ── Luna curentă ──────────────────────────────────────────────────
        LocalDateTime monthStart = now.with(TemporalAdjusters.firstDayOfMonth()).toLocalDate().atStartOfDay();
        LocalDateTime monthEnd   = now.with(TemporalAdjusters.firstDayOfNextMonth()).toLocalDate().atStartOfDay();
        LocalDateTime prevMonthStart = monthStart.minusMonths(1);

        // ── Counters via JPQL ─────────────────────────────────────────────
        long weeklyAppts   = appointmentRepository.countByRange(cabinetId, weekStart, weekEnd);
        long prevWeekAppts = appointmentRepository.countByRange(cabinetId, prevWeekStart, weekStart);
        long noShowsMonth  = appointmentRepository.countNoShows(cabinetId, monthStart, monthEnd);
        long totalMonth    = appointmentRepository.countByRange(cabinetId, monthStart, monthEnd);

        long newPatientsMonth = patientRepository.countNewPatients(cabinetId, monthStart, monthEnd);
        long prevNewPatients  = patientRepository.countNewPatients(cabinetId, prevMonthStart, monthStart);

        // ── Trend strings ─────────────────────────────────────────────────
        String weeklyTrend = prevWeekAppts > 0
                ? String.format("%+.0f%%", ((double)(weeklyAppts - prevWeekAppts) / prevWeekAppts) * 100)
                : (weeklyAppts > 0 ? "+" + weeklyAppts : "");

        String newPatientsTrend = prevNewPatients > 0
                ? String.format("%+d", newPatientsMonth - prevNewPatients)
                : String.valueOf(newPatientsMonth);

        String noShowsPct = totalMonth > 0
                ? String.format("%.1f%%", ((double) noShowsMonth / totalMonth) * 100)
                : "0%";

        // ── Weekly appointments pe zile (Luni–Duminică săptămâna curentă) ──
        List<Map<String, Object>> weeklyApptsPerDay = new ArrayList<>();
        LocalDate monday = LocalDate.now().with(java.time.DayOfWeek.MONDAY);
        for (int i = 0; i < 7; i++) {
            LocalDate day = monday.plusDays(i);
            long count = appointmentRepository.countByRange(cabinetId,
                    day.atStartOfDay(), day.plusDays(1).atStartOfDay());
            weeklyApptsPerDay.add(Map.of(
                    "day",   day.getDayOfWeek().getDisplayName(TextStyle.SHORT, ro),
                    "count", count,
                    "date",  day.toString()
            ));
        }

        // ── Monthly trend (ultimele 6 luni) ──────────────────────────────
        List<Map<String, Object>> monthlyTrend = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime mStart = now.minusMonths(i)
                    .with(TemporalAdjusters.firstDayOfMonth()).toLocalDate().atStartOfDay();
            LocalDateTime mEnd = mStart.plusMonths(1);
            long appts    = appointmentRepository.countByRange(cabinetId, mStart, mEnd);
            long patients = patientRepository.countNewPatients(cabinetId, mStart, mEnd);
            String month  = mStart.getMonth().getDisplayName(TextStyle.SHORT, ro);
            monthlyTrend.add(Map.of(
                    "month",       month,
                    "appointments", appts,
                    "patients",    patients,
                    "revenue",     0   // placeholder — calculat când prețuri sunt disponibile
            ));
        }

        // ── Service breakdown (luna curentă) ─────────────────────────────
        var apptThisMonth = appointmentRepository.findByRange(cabinetId, monthStart, monthEnd);
        var treatmentTypes = treatmentTypeRepository.findByCabinetId(cabinetId);

        List<Map<String, Object>> serviceBreakdown = new ArrayList<>();
        for (var tt : treatmentTypes) {
            long count = apptThisMonth.stream()
                    .filter(a -> a.getTreatmentType() != null
                              && a.getTreatmentType().getId().equals(tt.getId()))
                    .count();
            double pct = totalMonth > 0 ? (double) count / totalMonth * 100 : 0;
            serviceBreakdown.add(Map.of(
                    "service", tt.getName(),
                    "count",   count,
                    "pct",     Math.round(pct * 10) / 10.0,
                    "color",   tt.getColor()
            ));
        }

        // ── Răspuns final ─────────────────────────────────────────────────
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("weeklyAppointments", weeklyAppts);
        result.put("weeklyTrend",        weeklyTrend);
        result.put("newPatientsMonth",   newPatientsMonth);
        result.put("newPatientsTrend",   newPatientsTrend);
        result.put("noShowsMonth",       noShowsMonth);
        result.put("noShowsPct",         noShowsPct);
        result.put("smsCredits",         cabinet.getSmsCredits());
        result.put("smsDeliveryRate",    "");
        result.put("weeklyAppts",        weeklyApptsPerDay);
        result.put("monthlyTrend",       monthlyTrend);
        result.put("serviceBreakdown",   serviceBreakdown);
        return result;
    }
}
