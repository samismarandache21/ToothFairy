package com.toothfairy.import_agenda;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class NormalizareServiceTest {

    private final NormalizareService service = new NormalizareService();

    // ── Abbreviation expansion ──────────────────────────────────────────────

    @Test
    void normalize_det_returnsDetartraj() {
        var result = service.normalize("det");
        assertThat(result.tratament()).isEqualTo("Detartraj");
        assertThat(result.note()).isNull();
    }

    @Test
    void normalize_detWithDot_returnsDetartraj() {
        var result = service.normalize("det.");
        assertThat(result.tratament()).isEqualTo("Detartraj");
    }

    @Test
    void normalize_ctrl_returnsControl() {
        var result = service.normalize("ctrl");
        assertThat(result.tratament()).isEqualTo("Control");
    }

    @Test
    void normalize_ctrlWithDot_returnsControl() {
        var result = service.normalize("ctrl.");
        assertThat(result.tratament()).isEqualTo("Control");
    }

    @Test
    void normalize_pl_returnsPlomba() {
        var result = service.normalize("pl");
        assertThat(result.tratament()).isEqualTo("Plombă");
    }

    @Test
    void normalize_plomba_returnsPlomba() {
        var result = service.normalize("plomba");
        assertThat(result.tratament()).isEqualTo("Plombă");
    }

    @Test
    void normalize_rx_returnsRadiografie() {
        var result = service.normalize("rx");
        assertThat(result.tratament()).isEqualTo("Radiografie");
    }

    @Test
    void normalize_extractie_returnsExtractie() {
        var result = service.normalize("extractie");
        assertThat(result.tratament()).isEqualTo("Extracție");
    }

    @Test
    void normalize_extracțieWithDiacritic_returnsExtractie() {
        var result = service.normalize("extracție");
        assertThat(result.tratament()).isEqualTo("Extracție");
    }

    @Test
    void normalize_consultatie_returnsConsultatie() {
        var result = service.normalize("consultatie");
        assertThat(result.tratament()).isEqualTo("Consultație");
    }

    // ── Note extraction ──────────────────────────────────────────────────────

    @Test
    void normalize_mof_isExtractedAsNote() {
        var result = service.normalize("det mof");
        assertThat(result.tratament()).isEqualTo("Detartraj");
        assertThat(result.note()).contains("mof");
    }

    @Test
    void normalize_postOp_isExtractedAsNote() {
        var result = service.normalize("ctrl post-op");
        // "post-op" splits into "post" and "op" — both are note keywords
        assertThat(result.tratament()).isEqualTo("Control");
        assertThat(result.note()).isNotNull();
    }

    // ── Multiple abbreviations — extra ones become notes ─────────────────────

    @Test
    void normalize_twoAbbreviations_firstIsTreatmentRestAreNotes() {
        var result = service.normalize("det ctrl");
        assertThat(result.tratament()).isEqualTo("Detartraj");
        assertThat(result.note()).contains("Control");
    }

    // ── Blank / unknown input ────────────────────────────────────────────────

    @Test
    void normalize_blankInput_returnsConsultatie() {
        var result = service.normalize("");
        assertThat(result.tratament()).isEqualTo("Consultație");
        assertThat(result.note()).isNull();
    }

    @Test
    void normalize_whitespaceOnly_returnsConsultatie() {
        var result = service.normalize("   ");
        assertThat(result.tratament()).isEqualTo("Consultație");
    }

    @Test
    void normalize_unknownText_returnsOriginalText() {
        var result = service.normalize("Albire dentara");
        assertThat(result.tratament()).isEqualTo("Albire dentara");
        assertThat(result.note()).isNull();
    }

    @Test
    void normalize_molar_isExtractedAsNote() {
        var result = service.normalize("det molar");
        assertThat(result.tratament()).isEqualTo("Detartraj");
        assertThat(result.note()).contains("molar");
    }
}
