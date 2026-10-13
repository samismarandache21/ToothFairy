package com.toothfairy.patient_auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PatientAccountRepository extends JpaRepository<PatientAccount, UUID> {

    Optional<PatientAccount> findByEmail(String email);

    boolean existsByEmail(String email);
}
