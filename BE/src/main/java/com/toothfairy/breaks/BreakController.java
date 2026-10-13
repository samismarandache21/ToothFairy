package com.toothfairy.breaks;

import com.toothfairy.cabinet.Cabinet;
import com.toothfairy.cabinet.CabinetRepository;
import com.toothfairy.common.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/breaks")
@RequiredArgsConstructor
public class BreakController {

    private final BreakRepository breakRepository;
    private final CabinetRepository cabinetRepository;
    private final SecurityUtils securityUtils;

    @GetMapping
    public ResponseEntity<List<Break>> getAll() {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        return ResponseEntity.ok(breakRepository.findByCabinetId(cabinetId));
    }

    @PostMapping
    public ResponseEntity<Break> create(@Valid @RequestBody BreakRequest req) {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        Cabinet cabinet = cabinetRepository.findById(cabinetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        Break b = Break.builder()
                .cabinet(cabinet)
                .title(req.getTitle())
                .startTime(req.getStartTime())
                .durationMinutes(req.getDurationMinutes())
                .recurrenceType(req.getRecurrenceType().toUpperCase())
                .dayOfWeek(req.getDayOfWeek())
                .dayOfMonth(req.getDayOfMonth())
                .date(req.getDate())
                .color(req.getColor() != null ? req.getColor() : "#F59E0B")
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(breakRepository.save(b));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Break> update(@PathVariable UUID id, @Valid @RequestBody BreakRequest req) {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        Break b = breakRepository.findById(id)
                .filter(br -> br.getCabinet().getId().equals(cabinetId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        b.setTitle(req.getTitle());
        b.setStartTime(req.getStartTime());
        b.setDurationMinutes(req.getDurationMinutes());
        b.setRecurrenceType(req.getRecurrenceType().toUpperCase());
        b.setDayOfWeek(req.getDayOfWeek());
        b.setDayOfMonth(req.getDayOfMonth());
        b.setDate(req.getDate());
        if (req.getColor() != null) b.setColor(req.getColor());

        return ResponseEntity.ok(breakRepository.save(b));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable UUID id) {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        Break b = breakRepository.findById(id)
                .filter(br -> br.getCabinet().getId().equals(cabinetId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        breakRepository.delete(b);
        return ResponseEntity.ok(Map.of("message", "Pauza a fost ștearsă"));
    }
}
