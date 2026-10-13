package com.toothfairy.patient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PatientRepository extends JpaRepository<Patient, UUID> {

    List<Patient> findByCabinetIdOrderByLastNameAsc(UUID cabinetId);

    Optional<Patient> findByIdAndCabinetId(UUID id, UUID cabinetId);

    Optional<Patient> findByCabinetIdAndPhone(UUID cabinetId, String phone);

    List<Patient> findAllByPhone(String phone);

    boolean existsByCabinetIdAndPhone(UUID cabinetId, String phone);

    @Query("""
        SELECT p FROM Patient p
        WHERE p.phone = :phone
          AND (p.email IS NULL OR p.email = '' OR LOWER(p.email) = LOWER(:email))
        """)
    List<Patient> findByPhoneAndMatchingEmail(
            @Param("phone") String phone,
            @Param("email") String email);

    @Query("""
        SELECT p FROM Patient p
        WHERE p.cabinet.id = :cabinetId
          AND (
            LOWER(p.firstName) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(p.lastName)  LIKE LOWER(CONCAT('%', :q, '%'))
            OR p.phone             LIKE CONCAT('%', :q, '%')
            OR LOWER(p.email)     LIKE LOWER(CONCAT('%', :q, '%'))
          )
        ORDER BY p.lastName
        """)
    List<Patient> search(@Param("cabinetId") UUID cabinetId, @Param("q") String q);

    @Query("""
        SELECT COUNT(p) FROM Patient p
        WHERE p.cabinet.id  = :cabinetId
          AND p.createdAt  >= :from
          AND p.createdAt   < :to
        """)
    long countNewPatients(
            @Param("cabinetId") UUID cabinetId,
            @Param("from")      LocalDateTime from,
            @Param("to")        LocalDateTime to);
}
