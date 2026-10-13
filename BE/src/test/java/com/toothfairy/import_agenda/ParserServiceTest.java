package com.toothfairy.import_agenda;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.*;

class ParserServiceTest {

    private final ParserService service = new ParserService();

    // ── Basic parsing ────────────────────────────────────────────────────────

    @Test
    void parse_simpleFormat_returnsOneAppointment() {
        String text = "8 mai 2026\n09:00 Ion Popescu - detartraj";
        var result = service.parse(text);
        assertThat(result.lines()).hasSize(1);
        var line = result.lines().get(0);
        assertThat(line.numeComplet()).isEqualTo("Ion Popescu");
        assertThat(line.oraStart()).isEqualTo(LocalTime.of(9, 0));
        assertThat(line.tratamentBrut()).containsIgnoringCase("detartraj");
    }

    @Test
    void parse_dateExtracted_correctlyParsed() {
        String text = "15 iunie 2026\n10:30 Maria Ionescu - control";
        var result = service.parse(text);
        assertThat(result.data()).isEqualTo(LocalDate.of(2026, 6, 15));
    }

    @Test
    void parse_multipleAppointments_returnsAll() {
        String text = "8 mai 2026\n09:00 Ion Popescu - det\n10:00 Ana Popa - ctrl\n11:30 Dan Marin - pl";
        var result = service.parse(text);
        assertThat(result.lines()).hasSize(3);
    }

    @Test
    void parse_timeWithDot_parsed() {
        String text = "8 mai 2026\n9.30 Andrei Pop - radiografie";
        var result = service.parse(text);
        assertThat(result.lines()).hasSize(1);
        assertThat(result.lines().get(0).oraStart()).isEqualTo(LocalTime.of(9, 30));
    }

    @Test
    void parse_timeWithH_parsed() {
        String text = "8 mai 2026\n14h00 Cristina Luca - extractie";
        var result = service.parse(text);
        assertThat(result.lines()).hasSize(1);
        assertThat(result.lines().get(0).oraStart()).isEqualTo(LocalTime.of(14, 0));
    }

    @Test
    void parse_noAppointments_throwsUnprocessableEntity() {
        assertThatThrownBy(() -> service.parse("Nimic relevant aici."))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("programări");
    }

    @Test
    void parse_emptyString_throwsUnprocessableEntity() {
        assertThatThrownBy(() -> service.parse(""))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void parse_multipleDateHeaders_appointmentsAssignedToCorrectDate() {
        String text = """
                8 mai 2026
                09:00 Ion Popescu - det
                9 mai 2026
                10:00 Ana Popa - ctrl
                """;
        var result = service.parse(text);
        assertThat(result.lines()).hasSize(2);
        assertThat(result.lines().get(0).date()).isEqualTo(LocalDate.of(2026, 5, 8));
        assertThat(result.lines().get(1).date()).isEqualTo(LocalDate.of(2026, 5, 9));
    }

    @Test
    void parse_timeAtEndOfLine_treatmentMissing_nameStillParsed() {
        String text = "8 mai 2026\n09:00 Vasile Radu";
        var result = service.parse(text);
        assertThat(result.lines()).hasSize(1);
        assertThat(result.lines().get(0).numeComplet()).isEqualTo("Vasile Radu");
    }

    // ── Date extraction edge cases ────────────────────────────────────────────

    @Test
    void parse_dateInLowerCase_parsed() {
        String text = "12 octombrie 2025\n08:00 Tudor Nica - pl";
        var result = service.parse(text);
        assertThat(result.data()).isEqualTo(LocalDate.of(2025, 10, 12));
    }

    @Test
    void parse_noDateInText_usesDefaultDate() {
        String text = "09:00 Ana Maria - control";
        // Should not throw — falls back to today
        var result = service.parse(text);
        assertThat(result.data()).isEqualTo(LocalDate.now());
        assertThat(result.lines()).hasSize(1);
    }

    // ── Treatment separator variants ──────────────────────────────────────────

    @Test
    void parse_emDashSeparator_parsed() {
        String text = "8 mai 2026\n09:00 Ion Pop — extractie";
        var result = service.parse(text);
        assertThat(result.lines()).hasSize(1);
        assertThat(result.lines().get(0).numeComplet()).isEqualTo("Ion Pop");
    }

    @Test
    void parse_enDashSeparator_parsed() {
        String text = "8 mai 2026\n09:00 Ion Pop – extractie";
        var result = service.parse(text);
        assertThat(result.lines()).hasSize(1);
    }
}
