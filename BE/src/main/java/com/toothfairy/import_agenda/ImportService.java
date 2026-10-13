package com.toothfairy.import_agenda;

import com.toothfairy.appointment.Appointment;
import com.toothfairy.appointment.AppointmentRepository;
import com.toothfairy.cabinet.Cabinet;
import com.toothfairy.cabinet.CabinetRepository;
import com.toothfairy.import_agenda.NormalizareService.NormalizareResult;
import com.toothfairy.import_agenda.ParserService.ParsedLine;
import com.toothfairy.import_agenda.ParserService.ParseResult;
import com.toothfairy.import_agenda.dto.ImportConfirmRequest;
import com.toothfairy.import_agenda.dto.ImportPreviewResponse;
import com.toothfairy.import_agenda.dto.ImportedAppointmentDTO;
import com.toothfairy.patient.Patient;
import com.toothfairy.patient.PatientRepository;
import com.toothfairy.service.TreatmentType;
import com.toothfairy.service.TreatmentTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImportService {

    private static final UUID ZERO_UUID = new UUID(0, 0);

    private static final String[] IMPORT_COLORS = {
        "#2DD4BF", "#3B82F6", "#8B5CF6", "#F59E0B",
        "#EC4899", "#10B981", "#F97316", "#06B6D4"
    };

    private final OcrService             ocrService;
    private final ParserService          parserService;
    private final NormalizareService     normalizareService;
    private final DurataService          durataService;
    private final PatientRepository      patientRepository;
    private final AppointmentRepository  appointmentRepository;
    private final CabinetRepository      cabinetRepository;
    private final TreatmentTypeRepository treatmentTypeRepository;

    public String getRawOcrText(MultipartFile file) {
        return ocrService.extractText(file);
    }

    public ImportPreviewResponse preview(MultipartFile file, UUID cabinetId) {
        String rawText = ocrService.extractText(file);
        ParseResult parsed = parserService.parse(rawText);

        List<ParsedLine> lines  = parsed.lines();
        List<Integer>    durate = durataService.calculeazaDurate(lines);

        List<ImportedAppointmentDTO> dtos = new ArrayList<>();

        for (int i = 0; i < lines.size(); i++) {
            if (durate.get(i) == -1) continue;

            ParsedLine line = lines.get(i);
            NormalizareResult norm = normalizareService.normalize(line.tratamentBrut());

            List<Patient> potriviri = patientRepository.search(cabinetId, line.numeComplet());
            boolean existent = !potriviri.isEmpty();
            UUID pacientId   = existent ? potriviri.get(0).getId() : null;

            dtos.add(ImportedAppointmentDTO.builder()
                .numeComplet(line.numeComplet())
                .data(line.date())
                .oraStart(line.oraStart())
                .durataMinte(durate.get(i))
                .tratament(norm.tratament())
                .note(norm.note())
                .pacientExistent(existent)
                .pacientId(pacientId)
                .build());
        }

        long pauze = durataService.numarPauze(durate);
        double medie = durataService.mediaDurata(durate);

        return ImportPreviewResponse.builder()
            .data(parsed.data())
            .programari(dtos)
            .totalDetectate(lines.size())
            .pauzeIgnorate((int) pauze)
            .mediaDurata(medie)
            .build();
    }

    @Transactional
    public int confirm(ImportConfirmRequest req, UUID cabinetId) {
        Cabinet cabinet = cabinetRepository.findById(cabinetId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cabinet negăsit."));

        int created = 0;
        int colorIdx = 0;

        for (ImportedAppointmentDTO dto : req.getProgramari()) {
            Patient patient = resolvePatient(dto, cabinet, cabinetId);
            if (patient == null) continue;

            final String color = IMPORT_COLORS[colorIdx % IMPORT_COLORS.length];
            colorIdx++;

            TreatmentType treatmentType = resolveTreatmentType(cabinetId, cabinet, dto.getTratament(), color);

            LocalDateTime startTime = dto.getData().atTime(dto.getOraStart());
            LocalDateTime endTime   = startTime.plusMinutes(dto.getDurataMinte());

            if (appointmentRepository.existsConflict(cabinetId, startTime, endTime, ZERO_UUID)) {
                log.warn("Conflict detectat pentru {}, se omite.", dto.getNumeComplet());
                continue;
            }

            String note = buildNote(dto, treatmentType);

            Appointment appointment = Appointment.builder()
                .cabinet(cabinet)
                .patient(patient)
                .treatmentType(treatmentType)
                .startTime(startTime)
                .endTime(endTime)
                .status("confirmed")
                .notes(note)
                .build();

            appointmentRepository.save(appointment);
            created++;
        }

        return created;
    }

    private Patient resolvePatient(ImportedAppointmentDTO dto, Cabinet cabinet, UUID cabinetId) {
        if (dto.isPacientExistent() && dto.getPacientId() != null) {
            return patientRepository.findByIdAndCabinetId(dto.getPacientId(), cabinetId)
                .orElse(null);
        }

        // Try to match an existing patient by full name before creating a new one
        List<Patient> matches = patientRepository.search(cabinetId, dto.getNumeComplet().trim());
        if (!matches.isEmpty()) {
            String normalized = dto.getNumeComplet().trim().toLowerCase();
            for (Patient candidate : matches) {
                String fullName = (candidate.getFirstName() + " " + candidate.getLastName()).trim().toLowerCase();
                String reverseName = (candidate.getLastName() + " " + candidate.getFirstName()).trim().toLowerCase();
                if (fullName.equals(normalized) || reverseName.equals(normalized)) {
                    return candidate;
                }
            }
        }

        String[] parts     = dto.getNumeComplet().trim().split("\\s+", 2);
        String firstName   = parts[0];
        String lastName    = parts.length > 1 ? parts[1] : "-";

        String phone;
        do {
            phone = "import-" + UUID.randomUUID().toString().substring(0, 8);
        } while (patientRepository.existsByCabinetIdAndPhone(cabinetId, phone));

        Patient patient = Patient.builder()
            .cabinet(cabinet)
            .firstName(firstName)
            .lastName(lastName)
            .phone(phone)
            .build();

        return patientRepository.save(patient);
    }

    private TreatmentType resolveTreatmentType(UUID cabinetId, Cabinet cabinet, String name, String color) {
        // 1. Exact match (case-insensitive)
        var exact = treatmentTypeRepository.findByCabinetIdAndNameIgnoreCase(cabinetId, name);
        if (exact.isPresent()) return exact.get();

        // 2. Prefix match — e.g. "Detartraj" matches "Detartraj + Air Flow"
        String lower = name.toLowerCase();
        return treatmentTypeRepository.findByCabinetId(cabinetId).stream()
            .filter(t -> t.getName().toLowerCase().startsWith(lower))
            .min(Comparator.comparingInt(t -> t.getName().length()))
            .orElseGet(() -> treatmentTypeRepository.save(
                TreatmentType.builder()
                    .cabinet(cabinet)
                    .name(name)
                    .color(color)
                    .build()
            ));
    }

    private String buildNote(ImportedAppointmentDTO dto, TreatmentType treatmentType) {
        return (dto.getNote() != null && !dto.getNote().isBlank()) ? dto.getNote() : null;
    }
}
