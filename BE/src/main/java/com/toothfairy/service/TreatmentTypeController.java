package com.toothfairy.service;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/treatment-types")
@RequiredArgsConstructor
public class TreatmentTypeController {

    private final TreatmentTypeService treatmentTypeService;

    @GetMapping
    public ResponseEntity<List<TreatmentTypeResponse>> getAll() {
        return ResponseEntity.ok(treatmentTypeService.getAll());
    }

    @PostMapping
    public ResponseEntity<TreatmentTypeResponse> create(@Valid @RequestBody TreatmentTypeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(treatmentTypeService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TreatmentTypeResponse> update(
            @PathVariable UUID id,
            @RequestBody TreatmentTypeRequest request) {
        return ResponseEntity.ok(treatmentTypeService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        treatmentTypeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
