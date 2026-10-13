package com.toothfairy.review;

import com.toothfairy.common.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final SecurityUtils    securityUtils;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");

    // ── GET /api/reviews ─────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMyReviews() {
        UUID cabinetId = securityUtils.getCurrentCabinetId();

        List<Map<String, Object>> result = reviewRepository
                .findByCabinetIdOrderByCreatedAtDesc(cabinetId)
                .stream()
                .map(r -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id",         r.getId());
                    m.put("name",       r.getAuthorName() != null ? r.getAuthorName() : "Pacient anonim");
                    m.put("stars",      r.getRating());
                    m.put("text",       r.getText() != null ? r.getText() : "");
                    m.put("date",       r.getCreatedAt() != null ? r.getCreatedAt().format(FMT) : "");
                    m.put("platform",   "ToothFairy");
                    return m;
                })
                .toList();

        return ResponseEntity.ok(result);
    }
}
