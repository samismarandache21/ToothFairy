package com.toothfairy.public_portal;

import com.toothfairy.appointment.Appointment;
import com.toothfairy.appointment.AppointmentRepository;
import com.toothfairy.breaks.Break;
import com.toothfairy.breaks.BreakRepository;
import com.toothfairy.cabinet.Cabinet;
import com.toothfairy.cabinet.CabinetRepository;
import com.toothfairy.patient.PatientRepository;
import com.toothfairy.review.ReviewRepository;
import com.toothfairy.service.TreatmentTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests the slot-generation algorithm in PublicController.getSlots().
 * No Spring context — pure Mockito unit test for maximum speed.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PublicControllerSlotTest {

    @Mock CabinetRepository       cabinetRepository;
    @Mock TreatmentTypeRepository treatmentTypeRepository;
    @Mock AppointmentRepository   appointmentRepository;
    @Mock PatientRepository       patientRepository;
    @Mock ReviewRepository        reviewRepository;
    @Mock BreakRepository         breakRepository;

    @InjectMocks PublicController controller;

    private Cabinet cabinet;
    private UUID    cabinetId;
    // Use a fixed Monday so weekend-guard never interferes
    private static final LocalDate MONDAY = LocalDate.of(2026, 6, 8);

    @BeforeEach
    void setup() {
        cabinetId = UUID.randomUUID();
        cabinet   = Cabinet.builder().id(cabinetId).slug("test-clinic").build();

        // Default: no appointments, no breaks
        when(cabinetRepository.findBySlug("test-clinic")).thenReturn(Optional.of(cabinet));
        when(appointmentRepository.findByDay(eq(cabinetId), any(), any())).thenReturn(List.of());
        when(breakRepository.findByCabinetId(cabinetId)).thenReturn(List.of());
    }

    // ── Weekend guard ─────────────────────────────────────────────────────────

    @Test
    void getSlots_saturday_returnsEmpty() {
        LocalDate saturday = LocalDate.of(2026, 6, 13);
        var result = controller.getSlots("test-clinic", saturday, null);
        assertThat(result.getBody()).isEmpty();
        // No DB access needed for weekend
        verify(appointmentRepository, never()).findByDay(any(), any(), any());
    }

    @Test
    void getSlots_sunday_returnsEmpty() {
        LocalDate sunday = LocalDate.of(2026, 6, 14);
        var result = controller.getSlots("test-clinic", sunday, null);
        assertThat(result.getBody()).isEmpty();
    }

    // ── Default 30-min slots on a clear Monday ────────────────────────────────

    @Test
    void getSlots_noAppointmentsNoBreaks_returns20Slots() {
        // 08:00 to 18:00 in 30-min steps = 20 slots
        var result = controller.getSlots("test-clinic", MONDAY, null);
        assertThat(result.getBody()).hasSize(20);
    }

    @Test
    void getSlots_noAppointments_firstSlotIs0800() {
        var result = controller.getSlots("test-clinic", MONDAY, null);
        assertThat(result.getBody()).first().isEqualTo("08:00");
    }

    @Test
    void getSlots_noAppointments_lastSlotIs1730() {
        var result = controller.getSlots("test-clinic", MONDAY, null);
        List<String> slots = result.getBody();
        assertThat(slots).last().isEqualTo("17:30");
    }

    // ── Duration-aware slot count ─────────────────────────────────────────────

    @Test
    void getSlots_60minDuration_returns19Slots() {
        // 08:00–18:00 in 30-min steps but each slot needs 60 min:
        // last valid start = 17:00 → 19 slots (08:00, 08:30 … 17:00)
        var result = controller.getSlots("test-clinic", MONDAY, 60);
        assertThat(result.getBody()).hasSize(19);
    }

    @Test
    void getSlots_60minDuration_lastSlotIs1700() {
        var result = controller.getSlots("test-clinic", MONDAY, 60);
        assertThat(result.getBody()).last().isEqualTo("17:00");
    }

    @Test
    void getSlots_120minDuration_lastSlotIs1600() {
        var result = controller.getSlots("test-clinic", MONDAY, 120);
        assertThat(result.getBody()).last().isEqualTo("16:00");
    }

    @Test
    void getSlots_zeroDuration_treatedAs30min() {
        var result = controller.getSlots("test-clinic", MONDAY, 0);
        assertThat(result.getBody()).hasSize(20);
    }

    // ── Appointment blocking ───────────────────────────────────────────────────

    @Test
    void getSlots_existingConfirmedAppointment_blocksOverlappingSlots() {
        // Appointment 09:00–10:00 should block 08:30 (overlaps), 09:00, 09:30
        Appointment appt = buildAppointment("confirmed",
                LocalTime.of(9, 0), LocalTime.of(10, 0));
        when(appointmentRepository.findByDay(eq(cabinetId), any(), any())).thenReturn(List.of(appt));

        var result = controller.getSlots("test-clinic", MONDAY, null);
        List<String> slots = result.getBody();

        // 08:30 ends exactly at 09:00 (appointment start) — no overlap (strict >), still available
        assertThat(slots).doesNotContain("09:00", "09:30");
        assertThat(slots).contains("08:00", "08:30", "10:00");
    }

    @Test
    void getSlots_cancelledAppointment_doesNotBlockSlot() {
        Appointment appt = buildAppointment("cancelled",
                LocalTime.of(9, 0), LocalTime.of(9, 30));
        when(appointmentRepository.findByDay(eq(cabinetId), any(), any())).thenReturn(List.of(appt));

        var result = controller.getSlots("test-clinic", MONDAY, null);

        assertThat(result.getBody()).contains("09:00");
    }

    @Test
    void getSlots_adjacentAppointments_noGap_allMiddleSlotsBlocked() {
        // 09:00–10:00 + 10:00–11:00 → 08:30 and 09:00..10:30 blocked
        Appointment a1 = buildAppointment("confirmed", LocalTime.of(9, 0), LocalTime.of(10, 0));
        Appointment a2 = buildAppointment("confirmed", LocalTime.of(10, 0), LocalTime.of(11, 0));
        when(appointmentRepository.findByDay(eq(cabinetId), any(), any())).thenReturn(List.of(a1, a2));

        var result = controller.getSlots("test-clinic", MONDAY, null);
        List<String> slots = result.getBody();

        // 08:30 ends exactly at 09:00 (first appt start) — no overlap, still available
        assertThat(slots).doesNotContain("09:00", "09:30", "10:00", "10:30");
        assertThat(slots).contains("08:00", "08:30", "11:00");
    }

    // ── Break blocking ────────────────────────────────────────────────────────

    @Test
    void getSlots_dailyBreak_blocksSlot() {
        Break b = buildBreak("DAILY", null, null, null,
                LocalTime.of(13, 0), 60);
        when(breakRepository.findByCabinetId(cabinetId)).thenReturn(List.of(b));

        var result = controller.getSlots("test-clinic", MONDAY, null);
        // Break 13:00–14:00: slot 12:30 ends exactly at 13:00 (break start) → no overlap, available
        // Slots 13:00 and 13:30 do overlap the break → blocked
        assertThat(result.getBody()).doesNotContain("13:00", "13:30");
        assertThat(result.getBody()).contains("12:00", "12:30", "14:00");
    }

    @Test
    void getSlots_weeklyBreakMatchingDay_blocksSlot() {
        // MONDAY.getDayOfWeek().getValue() = 1
        Break b = buildBreak("WEEKLY", 1, null, null,
                LocalTime.of(10, 0), 30);
        when(breakRepository.findByCabinetId(cabinetId)).thenReturn(List.of(b));

        var result = controller.getSlots("test-clinic", MONDAY, null);
        assertThat(result.getBody()).doesNotContain("10:00");
        assertThat(result.getBody()).contains("09:30", "10:30");
    }

    @Test
    void getSlots_weeklyBreakDifferentDay_doesNotBlock() {
        // Day 2 = Tuesday, but we're querying Monday (day 1)
        Break b = buildBreak("WEEKLY", 2, null, null,
                LocalTime.of(10, 0), 30);
        when(breakRepository.findByCabinetId(cabinetId)).thenReturn(List.of(b));

        var result = controller.getSlots("test-clinic", MONDAY, null);
        assertThat(result.getBody()).contains("10:00");
    }

    @Test
    void getSlots_monthlyBreakMatchingDay_blocksSlot() {
        // MONDAY = June 8 → dayOfMonth = 8
        Break b = buildBreak("MONTHLY", null, 8, null,
                LocalTime.of(9, 0), 30);
        when(breakRepository.findByCabinetId(cabinetId)).thenReturn(List.of(b));

        var result = controller.getSlots("test-clinic", MONDAY, null);
        assertThat(result.getBody()).doesNotContain("09:00");
    }

    @Test
    void getSlots_monthlyBreakDifferentDay_doesNotBlock() {
        Break b = buildBreak("MONTHLY", null, 15, null,
                LocalTime.of(9, 0), 30);
        when(breakRepository.findByCabinetId(cabinetId)).thenReturn(List.of(b));

        var result = controller.getSlots("test-clinic", MONDAY, null);
        assertThat(result.getBody()).contains("09:00");
    }

    @Test
    void getSlots_noneBreakMatchingDate_blocksSlot() {
        Break b = buildBreak("NONE", null, null, MONDAY,
                LocalTime.of(11, 0), 30);
        when(breakRepository.findByCabinetId(cabinetId)).thenReturn(List.of(b));

        var result = controller.getSlots("test-clinic", MONDAY, null);
        assertThat(result.getBody()).doesNotContain("11:00");
    }

    @Test
    void getSlots_noneBreakDifferentDate_doesNotBlock() {
        Break b = buildBreak("NONE", null, null, MONDAY.plusDays(1),
                LocalTime.of(11, 0), 30);
        when(breakRepository.findByCabinetId(cabinetId)).thenReturn(List.of(b));

        var result = controller.getSlots("test-clinic", MONDAY, null);
        assertThat(result.getBody()).contains("11:00");
    }

    // ── Overlap edge cases ────────────────────────────────────────────────────

    @Test
    void getSlots_slotExactlyTouchesAppointmentEnd_notBlocked() {
        // Appointment 08:00–09:00 → slot at 09:00 is NOT blocked
        Appointment appt = buildAppointment("confirmed",
                LocalTime.of(8, 0), LocalTime.of(9, 0));
        when(appointmentRepository.findByDay(eq(cabinetId), any(), any())).thenReturn(List.of(appt));

        var result = controller.getSlots("test-clinic", MONDAY, null);
        assertThat(result.getBody()).contains("09:00");
    }

    @Test
    void getSlots_slotExactlyTouchesAppointmentStart_notBlocked() {
        // Appointment 10:00–11:00 → slot ending at 10:00 (i.e. 09:30 with 30min) is NOT blocked
        Appointment appt = buildAppointment("confirmed",
                LocalTime.of(10, 0), LocalTime.of(11, 0));
        when(appointmentRepository.findByDay(eq(cabinetId), any(), any())).thenReturn(List.of(appt));

        var result = controller.getSlots("test-clinic", MONDAY, null);
        assertThat(result.getBody()).contains("09:30");
    }

    // ── Slug lookup ───────────────────────────────────────────────────────────

    @Test
    void getSlots_slugNotFound_throws404() {
        when(cabinetRepository.findBySlug("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.getSlots("unknown", MONDAY, null))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class)
                .extracting(e -> ((org.springframework.web.server.ResponseStatusException) e).getStatusCode().value())
                .isEqualTo(404);
    }

    @Test
    void getSlots_uuidSlug_lookupById() {
        UUID id = UUID.randomUUID();
        Cabinet c = Cabinet.builder().id(id).build();
        when(cabinetRepository.findById(id)).thenReturn(Optional.of(c));
        when(appointmentRepository.findByDay(eq(id), any(), any())).thenReturn(List.of());
        when(breakRepository.findByCabinetId(id)).thenReturn(List.of());

        var result = controller.getSlots(id.toString(), MONDAY, null);
        assertThat(result.getBody()).isNotNull();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Appointment buildAppointment(String status, LocalTime start, LocalTime end) {
        return Appointment.builder()
                .cabinet(cabinet)
                .startTime(MONDAY.atTime(start))
                .endTime(MONDAY.atTime(end))
                .status(status)
                .build();
    }

    private Break buildBreak(String recurrence, Integer dow, Integer dom,
                              LocalDate date, LocalTime startTime, int durationMinutes) {
        Break b = new Break();
        b.setCabinet(cabinet);
        b.setRecurrenceType(recurrence);
        b.setDayOfWeek(dow);
        b.setDayOfMonth(dom);
        b.setDate(date);
        b.setStartTime(startTime);
        b.setDurationMinutes(durationMinutes);
        return b;
    }
}
