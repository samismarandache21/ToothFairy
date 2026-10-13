package com.toothfairy.cabinet;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CabinetRepository extends JpaRepository<Cabinet, UUID> {

    Optional<Cabinet> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<Cabinet> findBySlug(String slug);

    List<Cabinet> findAllByOrderByRatingDesc();

    List<Cabinet> findAllByActiveTrueOrderByRatingDesc();

    List<Cabinet> findByClinicAccountId(UUID clinicAccountId);
}
