package com.toothfairy.import_agenda;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.json.Jackson2JsonDecoder;
import org.springframework.http.codec.json.Jackson2JsonEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class OcrService {

    private static final int MAX_BUFFER_MB = 20;

    private final WebClient    webClient;
    private final String       apiKey;
    private final ObjectMapper objectMapper;

    public OcrService(WebClient.Builder webClientBuilder,
                      @Value("${google.vision.api.key}") String apiKey,
                      ObjectMapper objectMapper) {
        ExchangeStrategies strategies = ExchangeStrategies.builder()
            .codecs(c -> {
                c.defaultCodecs().maxInMemorySize(MAX_BUFFER_MB * 1024 * 1024);
                c.defaultCodecs().jackson2JsonEncoder(new Jackson2JsonEncoder(objectMapper));
                c.defaultCodecs().jackson2JsonDecoder(new Jackson2JsonDecoder(objectMapper));
            })
            .build();

        this.webClient    = webClientBuilder
            .baseUrl("https://vision.googleapis.com")
            .exchangeStrategies(strategies)
            .build();
        this.apiKey       = apiKey;
        this.objectMapper = objectMapper;
    }

    public String extractText(MultipartFile file) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "Cheia Google Vision API nu este configurată (google.vision.api.key).");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nu s-a putut citi fișierul imagine.");
        }

        // Vision API inline limit is ~20MB; base64 adds ~33% overhead
        if (bytes.length > 15 * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Imaginea este prea mare. Maxim 15 MB.");
        }

        String base64 = Base64.getEncoder().encodeToString(bytes);

        // DOCUMENT_TEXT_DETECTION is optimized for dense/handwritten text (better than TEXT_DETECTION for agendas)
        Map<String, Object> body = Map.of(
            "requests", List.of(Map.of(
                "image",        Map.of("content", base64),
                "features",     List.of(Map.of("type", "DOCUMENT_TEXT_DETECTION")),
                "imageContext", Map.of("languageHints", List.of("ro"))
            ))
        );

        String rawResponse;
        try {
            rawResponse = webClient.post()
                .uri(uriBuilder -> uriBuilder
                    .path("/v1/images:annotate")
                    .queryParam("key", apiKey)
                    .build())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .block();
        } catch (Exception e) {
            log.error("Eroare la apelul Google Vision API", e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                "Nu s-a putut contacta Google Vision API: " + e.getMessage());
        }

        if (rawResponse == null || rawResponse.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Google Vision API nu a răspuns.");
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> parsed = objectMapper.readValue(rawResponse, Map.class);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> responses = (List<Map<String, Object>>) parsed.get("responses");
            if (responses == null || responses.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Google Vision API a returnat un răspuns gol.");
            }

            Map<String, Object> first = responses.get(0);

            // Vision embeds errors inside the response body (not as HTTP errors)
            if (first.containsKey("error")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> err = (Map<String, Object>) first.get("error");
                String msg = (String) err.getOrDefault("message", "Eroare necunoscută Vision API");
                log.error("Google Vision API a returnat eroare: {}", msg);
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Google Vision API: " + msg);
            }

            // DOCUMENT_TEXT_DETECTION returns text in fullTextAnnotation.text
            @SuppressWarnings("unchecked")
            Map<String, Object> fullText = (Map<String, Object>) first.get("fullTextAnnotation");
            if (fullText != null && fullText.get("text") instanceof String text && !text.isBlank()) {
                return text;
            }

            // Fallback: textAnnotations[0].description (TEXT_DETECTION / DOCUMENT_TEXT_DETECTION both populate this)
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> textAnnotations =
                (List<Map<String, Object>>) first.get("textAnnotations");

            if (textAnnotations != null && !textAnnotations.isEmpty()) {
                return (String) textAnnotations.get(0).get("description");
            }

            log.warn("Vision API nu a detectat text. Raw response: {}", rawResponse);
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "Nu s-a detectat text în imagine. Asigurați-vă că imaginea este clară și conține text lizibil.");
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Eroare la parsarea răspunsului Vision API. Raw: {}", rawResponse, e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                "Răspuns neașteptat de la Google Vision API.");
        }
    }
}
