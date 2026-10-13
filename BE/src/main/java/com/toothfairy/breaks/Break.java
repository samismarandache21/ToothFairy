package com.toothfairy.breaks;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.toothfairy.cabinet.Cabinet;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "schedule_breaks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Break {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cabinet_id", nullable = false)
    private Cabinet cabinet;

    @Column(nullable = false)
    private String title;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    // DAILY, WEEKLY, MONTHLY
    @Column(name = "recurrence_type", nullable = false)
    private String recurrenceType;

    // For WEEKLY: 1=Monday … 7=Sunday (null for DAILY/MONTHLY)
    @Column(name = "day_of_week")
    private Integer dayOfWeek;

    // For MONTHLY: 1–31 (null for DAILY/WEEKLY)
    @Column(name = "day_of_month")
    private Integer dayOfMonth;

    // For NONE (one-time): specific date (null for recurring)
    @Column(name = "break_date")
    private LocalDate date;

    @Builder.Default
    private String color = "#F59E0B";
}
