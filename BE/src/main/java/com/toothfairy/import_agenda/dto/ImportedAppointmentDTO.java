package com.toothfairy.import_agenda.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
public class ImportedAppointmentDTO {
    private String    numeComplet;
    private LocalDate data;
    private LocalTime oraStart;
    private int       durataMinte;
    private String    tratament;
    private String    note;
    private boolean   pacientExistent;
    private UUID      pacientId;
}
