package com.toothfairy.appointment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {

    @Query("""
        SELECT a FROM Appointment a
        JOIN FETCH a.patient
        LEFT JOIN FETCH a.treatmentType
        WHERE a.cabinet.id = :cabinetId
        ORDER BY a.startTime ASC
        """)
    List<Appointment> findByCabinetIdOrderByStartTimeAsc(@Param("cabinetId") UUID cabinetId);

    @Query("""
        SELECT a FROM Appointment a
        JOIN FETCH a.patient
        LEFT JOIN FETCH a.treatmentType
        WHERE a.id = :id AND a.cabinet.id = :cabinetId
        """)
    Optional<Appointment> findByIdAndCabinetId(@Param("id") UUID id, @Param("cabinetId") UUID cabinetId);

    // Programări dintr-o zi specifică
    @Query("""
        SELECT a FROM Appointment a
        JOIN FETCH a.patient
        LEFT JOIN FETCH a.treatmentType
        WHERE a.cabinet.id = :cabinetId
          AND a.startTime >= :dayStart
          AND a.startTime <  :dayEnd
        ORDER BY a.startTime
        """)
    List<Appointment> findByDay(
            @Param("cabinetId") UUID cabinetId,
            @Param("dayStart")  LocalDateTime dayStart,
            @Param("dayEnd")    LocalDateTime dayEnd);

    // Programări dintr-un interval
    @Query("""
        SELECT a FROM Appointment a
        JOIN FETCH a.patient
        LEFT JOIN FETCH a.treatmentType
        WHERE a.cabinet.id = :cabinetId
          AND a.startTime >= :from
          AND a.startTime <  :to
        ORDER BY a.startTime
        """)
    List<Appointment> findByRange(
            @Param("cabinetId") UUID cabinetId,
            @Param("from")      LocalDateTime from,
            @Param("to")        LocalDateTime to);

    // Conflict detection: există altă programare care se suprapune cu [start, end)?
    @Query("""
        SELECT COUNT(a) > 0 FROM Appointment a
        WHERE a.cabinet.id = :cabinetId
          AND a.status     != 'cancelled'
          AND a.id         != :excludeId
          AND a.endTime    >  a.startTime
          AND a.startTime  <  :endTime
          AND a.endTime    >  :startTime
        """)
    boolean existsConflict(
            @Param("cabinetId")  UUID cabinetId,
            @Param("startTime")  LocalDateTime startTime,
            @Param("endTime")    LocalDateTime endTime,
            @Param("excludeId")  UUID excludeId);

    // Programări de trimis SMS (ziua următoare, SMS nesent)
    @Query("""
        SELECT a FROM Appointment a
        JOIN FETCH a.patient
        LEFT JOIN FETCH a.treatmentType
        WHERE a.smsSent   = false
          AND a.status    = 'confirmed'
          AND a.startTime >= :from
          AND a.startTime <  :to
        """)
    List<Appointment> findForSmsReminder(
            @Param("from") LocalDateTime from,
            @Param("to")   LocalDateTime to);

    // Stats: număr programări într-un interval
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.cabinet.id = :cId AND a.startTime >= :from AND a.startTime < :to")
    long countByRange(@Param("cId") UUID cId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    // Programări pentru un pacient specific
    @Query("""
        SELECT a FROM Appointment a
        LEFT JOIN FETCH a.treatmentType
        WHERE a.patient.id = :patientId
        ORDER BY a.startTime DESC
        """)
    List<Appointment> findByPatientId(@Param("patientId") UUID patientId);

    // Stats: no-shows într-un interval
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.cabinet.id = :cId AND a.status = 'no_show' AND a.startTime >= :from AND a.startTime < :to")
    long countNoShows(@Param("cId") UUID cId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Modifying
    @Query("DELETE FROM Appointment a WHERE a.patient.id = :patientId")
    void deleteByPatientId(@Param("patientId") UUID patientId);

    @Modifying
    @Query("UPDATE Appointment a SET a.treatmentType = null WHERE a.treatmentType.id = :treatmentTypeId")
    void detachTreatmentType(@Param("treatmentTypeId") UUID treatmentTypeId);
}
