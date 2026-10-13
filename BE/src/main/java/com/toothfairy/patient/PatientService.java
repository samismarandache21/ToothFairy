package com.toothfairy.patient;

import com.toothfairy.appointment.Appointment;
import com.toothfairy.appointment.AppointmentRepository;
import com.toothfairy.cabinet.Cabinet;
import com.toothfairy.cabinet.CabinetRepository;
import com.toothfairy.common.SecurityUtils;
import com.toothfairy.patient.dto.PatientRequest;
import com.toothfairy.patient.dto.PatientResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository     patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final CabinetRepository     cabinetRepository;
    private final SecurityUtils         securityUtils;

    public List<PatientResponse> getAll() {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        return patientRepository.findByCabinetIdOrderByLastNameAsc(cabinetId)
                .stream()
                .map(p -> {
                    List<Appointment> appts = appointmentRepository
                            .findByCabinetIdOrderByStartTimeAsc(cabinetId)
                            .stream()
                            .filter(a -> a.getPatient().getId().equals(p.getId()))
                            .toList();
                    return PatientResponse.from(p, appts);
                })
                .toList();
    }

    public List<PatientResponse> search(String q) {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        List<Appointment> allAppts = appointmentRepository
                .findByCabinetIdOrderByStartTimeAsc(cabinetId);

        return patientRepository.search(cabinetId, q)
                .stream()
                .map(p -> {
                    List<Appointment> appts = allAppts.stream()
                            .filter(a -> a.getPatient().getId().equals(p.getId()))
                            .toList();
                    return PatientResponse.from(p, appts);
                })
                .toList();
    }

    public PatientResponse getById(UUID id) {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        Patient patient = patientRepository.findByIdAndCabinetId(id, cabinetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pacient negăsit"));

        List<Appointment> appts = appointmentRepository
                .findByCabinetIdOrderByStartTimeAsc(cabinetId)
                .stream()
                .filter(a -> a.getPatient().getId().equals(id))
                .toList();

        return PatientResponse.fromWithHistory(patient, appts);
    }

    public PatientResponse create(PatientRequest request) {
        UUID cabinetId = securityUtils.getCurrentCabinetId();

        if (request.getPhone() != null && !request.getPhone().isBlank() &&
            patientRepository.existsByCabinetIdAndPhone(cabinetId, request.getPhone())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Există deja un pacient cu acest număr de telefon");
        }

        Cabinet cabinet = cabinetRepository.findById(cabinetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cabinet negăsit"));

        Patient patient = Patient.builder()
                .cabinet(cabinet)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .birthDate(request.getBirthDate())
                .medicalNotes(request.getMedicalNotes())
                .allergies(request.getAllergies())
                .build();

        return PatientResponse.from(patientRepository.save(patient), List.of());
    }

    public PatientResponse update(UUID id, PatientRequest request) {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        Patient patient = patientRepository.findByIdAndCabinetId(id, cabinetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pacient negăsit"));

        String newPhone = request.getPhone();
        String oldPhone = patient.getPhone();
        if (newPhone != null && !newPhone.isBlank() &&
            !newPhone.equals(oldPhone) &&
            patientRepository.existsByCabinetIdAndPhone(cabinetId, newPhone)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Există deja un pacient cu acest număr de telefon");
        }

        patient.setFirstName(request.getFirstName());
        patient.setLastName(request.getLastName());
        patient.setPhone(request.getPhone());
        patient.setEmail(request.getEmail());
        patient.setBirthDate(request.getBirthDate());
        patient.setMedicalNotes(request.getMedicalNotes());
        patient.setAllergies(request.getAllergies());

        return PatientResponse.from(patientRepository.save(patient), List.of());
    }

    @Transactional
    public void delete(UUID id) {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        Patient patient = patientRepository.findByIdAndCabinetId(id, cabinetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pacient negăsit"));
        appointmentRepository.deleteByPatientId(id);
        patientRepository.delete(patient);
    }

    @Transactional(readOnly = true)
    public List<PatientResponse.FullHistoryItem> getFullHistory(UUID patientId) {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        Patient patient = patientRepository.findByIdAndCabinetId(patientId, cabinetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pacient negăsit"));

        List<Patient> allMatchingPatients = (patient.getPhone() != null && !patient.getPhone().isBlank())
                ? patientRepository.findAllByPhone(patient.getPhone())
                : List.of(patient);

        return allMatchingPatients.stream()
                .flatMap(p -> appointmentRepository.findByPatientId(p.getId()).stream()
                        .filter(a -> "completed".equals(a.getStatus()))
                        .map(a -> PatientResponse.FullHistoryItem.from(a, a.getCabinet().getId().equals(cabinetId))))
                .sorted(Comparator.comparing(PatientResponse.FullHistoryItem::getDate).reversed())
                .toList();
    }
}
