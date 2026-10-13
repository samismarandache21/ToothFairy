package com.toothfairy.service;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TreatmentTypeRepository extends JpaRepository<TreatmentType, UUID> {

    List<TreatmentType> findByCabinetId(UUID cabinetId);

    Optional<TreatmentType> findByIdAndCabinetId(UUID id, UUID cabinetId);

    Optional<TreatmentType> findByCabinetIdAndNameIgnoreCase(UUID cabinetId, String name);
}
