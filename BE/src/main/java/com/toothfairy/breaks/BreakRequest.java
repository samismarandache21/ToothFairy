package com.toothfairy.breaks;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class BreakRequest {
    @NotBlank
    private String title;

    @NotNull
    private LocalTime startTime;

    @NotNull
    private Integer durationMinutes;

    @NotBlank
    private String recurrenceType; // DAILY, WEEKLY, MONTHLY

    private Integer dayOfWeek;   // 1–7 for WEEKLY
    private Integer dayOfMonth;  // 1–31 for MONTHLY
    private LocalDate date;      // specific date for NONE (one-time)

    private String color;
}
