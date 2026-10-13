package com.toothfairy.service;

import com.toothfairy.appointment.AppointmentRepository;
import com.toothfairy.cabinet.Cabinet;
import com.toothfairy.cabinet.CabinetRepository;
import com.toothfairy.common.SecurityUtils;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TreatmentTypeService {

    private final TreatmentTypeRepository treatmentTypeRepository;
    private final AppointmentRepository   appointmentRepository;
    private final CabinetRepository       cabinetRepository;
    private final SecurityUtils           securityUtils;

    public List<TreatmentTypeResponse> getAll() {
        return treatmentTypeRepository.findByCabinetId(securityUtils.getCurrentCabinetId())
                .stream().map(TreatmentTypeResponse::from).toList();
    }

    public TreatmentTypeResponse create(TreatmentTypeRequest request) {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        Cabinet cabinet = cabinetRepository.findById(cabinetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cabinet negăsit"));

        TreatmentType tt = TreatmentType.builder()
                .cabinet(cabinet)
                .name(request.getName())
                .durationMinutes(request.getDurationMinutes() != null ? request.getDurationMinutes() : 30)
                .price(request.getPrice())
                .color(request.getColor() != null ? request.getColor() : "#2DD4BF")
                .isConsultation(request.getIsConsultation() != null && request.getIsConsultation())
                .requiresConsultForNew(request.getRequiresConsultForNew() != null && request.getRequiresConsultForNew())
                .build();

        return TreatmentTypeResponse.from(treatmentTypeRepository.save(tt));
    }

    public TreatmentTypeResponse update(UUID id, TreatmentTypeRequest request) {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        TreatmentType tt = treatmentTypeRepository.findByIdAndCabinetId(id, cabinetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviciu negăsit"));

        if (request.getName()                 != null) tt.setName(request.getName());
        if (request.getDurationMinutes()      != null) tt.setDurationMinutes(request.getDurationMinutes());
        if (request.getPrice()                != null) tt.setPrice(request.getPrice());
        if (request.getColor()                != null) tt.setColor(request.getColor());
        if (request.getIsConsultation()       != null) tt.setIsConsultation(request.getIsConsultation());
        if (request.getRequiresConsultForNew() != null) tt.setRequiresConsultForNew(request.getRequiresConsultForNew());

        return TreatmentTypeResponse.from(treatmentTypeRepository.save(tt));
    }

    @Transactional
    public void delete(UUID id) {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        TreatmentType tt = treatmentTypeRepository.findByIdAndCabinetId(id, cabinetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviciu negăsit"));
        appointmentRepository.detachTreatmentType(id);
        treatmentTypeRepository.delete(tt);
    }
}
