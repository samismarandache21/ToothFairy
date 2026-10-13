package com.toothfairy.clinic_admin;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DentistJoinRequestRepository extends JpaRepository<DentistJoinRequest, UUID> {

    List<DentistJoinRequest> findByClinicAccountIdOrderByRequestedAtDesc(UUID clinicAccountId);

    List<DentistJoinRequest> findByCabinetId(UUID cabinetId);

    boolean existsByCabinetIdAndClinicAccountIdAndStatus(UUID cabinetId, UUID clinicAccountId, String status);
}
