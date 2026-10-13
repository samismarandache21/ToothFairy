package com.toothfairy.import_agenda.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ImportConfirmRequest {
    @NotNull
    private LocalDate data;

    @NotEmpty
    private List<ImportedAppointmentDTO> programari;
}
