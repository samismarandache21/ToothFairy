package com.toothfairy.review;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {

    List<Review> findByCabinetIdOrderByCreatedAtDesc(UUID cabinetId);

    boolean existsByAppointmentId(UUID appointmentId);
}
