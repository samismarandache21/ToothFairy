package com.toothfairy.breaks;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BreakRepository extends JpaRepository<Break, UUID> {
    List<Break> findByCabinetId(UUID cabinetId);
}
