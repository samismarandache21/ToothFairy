package com.toothfairy.import_agenda;

import com.toothfairy.common.SecurityUtils;
import com.toothfairy.import_agenda.dto.ImportConfirmRequest;
import com.toothfairy.import_agenda.dto.ImportPreviewResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
public class ImportController {

    private final ImportService   importService;
    private final SecurityUtils   securityUtils;

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImportPreviewResponse> preview(
            @RequestParam("file") MultipartFile file) {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        return ResponseEntity.ok(importService.preview(file, cabinetId));
    }

    /** Debug: returns raw OCR text from Vision API without any parsing */
    @PostMapping(value = "/image/debug-ocr", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> debugOcr(
            @RequestParam("file") MultipartFile file) {
        String rawText = importService.getRawOcrText(file);
        return ResponseEntity.ok(Map.of("text", rawText));
    }

    @PostMapping("/confirm")
    public ResponseEntity<Map<String, Integer>> confirm(
            @Valid @RequestBody ImportConfirmRequest request) {
        UUID cabinetId = securityUtils.getCurrentCabinetId();
        int created = importService.confirm(request, cabinetId);
        return ResponseEntity.ok(Map.of("created", created));
    }
}
