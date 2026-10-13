package com.toothfairy.cabinet;

import com.toothfairy.common.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CabinetService {

    private final CabinetRepository cabinetRepository;
    private final SecurityUtils     securityUtils;

    public CabinetResponse getMe() {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        Cabinet cabinet = cabinetRepository.findById(cabinetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cabinet negăsit"));
        return CabinetResponse.from(cabinet);
    }

    public Cabinet getCabinetById(UUID id) {
        return cabinetRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cabinet negăsit"));
    }

    public CabinetResponse updateMe(CabinetUpdateRequest request) {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        Cabinet cabinet = cabinetRepository.findById(cabinetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cabinet negăsit"));

        if (request.getFirstName()   != null) cabinet.setFirstName(request.getFirstName());
        if (request.getLastName()    != null) cabinet.setLastName(request.getLastName());
        if (request.getName()        != null) cabinet.setName(request.getName());
        if (request.getPhone()       != null) cabinet.setPhone(request.getPhone());
        if (request.getAddress()     != null) cabinet.setAddress(request.getAddress());
        if (request.getCity()        != null) cabinet.setCity(request.getCity());
        if (request.getDescription() != null) cabinet.setDescription(request.getDescription());
        if (request.getSlug()        != null) cabinet.setSlug(request.getSlug().isBlank() ? null : request.getSlug().trim());
        if (request.getWebsite()     != null) cabinet.setWebsite(request.getWebsite());
        if (request.getSpecialties()          != null) cabinet.setSpecialties(request.getSpecialties());
        if (request.getLanguages()            != null) cabinet.setLanguages(request.getLanguages());
        if (request.getWorkingHours()         != null) cabinet.setWorkingHours(request.getWorkingHours());
        if (request.getSmsSettings()          != null) cabinet.setSmsSettings(request.getSmsSettings());
        if (request.getNotificationSettings() != null) cabinet.setNotificationSettings(request.getNotificationSettings());

        cabinet.setActive(true);
        return CabinetResponse.from(cabinetRepository.save(cabinet));
    }

    public void updateCoverPhoto(String coverPhoto) {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        Cabinet cabinet = cabinetRepository.findById(cabinetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cabinet negăsit"));
        cabinet.setCoverPhoto(coverPhoto);
        cabinetRepository.save(cabinet);
    }

    public void updateProfilePhoto(String profilePhoto) {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        Cabinet cabinet = cabinetRepository.findById(cabinetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cabinet negăsit"));
        cabinet.setProfilePhoto(profilePhoto);
        cabinetRepository.save(cabinet);
    }
}
