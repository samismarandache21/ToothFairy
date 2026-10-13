package com.toothfairy.clinic_admin;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ClinicAccountRepository extends JpaRepository<ClinicAccount, UUID> {
    Optional<ClinicAccount> findByEmail(String email);
    boolean existsByEmail(String email);
}
