package com.toothfairy.import_agenda.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class ImportPreviewResponse {
    private LocalDate                    data;
    private List<ImportedAppointmentDTO> programari;
    private int                          totalDetectate;
    private int                          pauzeIgnorate;
    private double                       mediaDurata;
}
