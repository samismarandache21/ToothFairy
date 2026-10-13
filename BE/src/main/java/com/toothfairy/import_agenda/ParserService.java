package com.toothfairy.import_agenda;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class ParserService {

    record ParsedLine(String numeComplet, LocalTime oraStart, String tratamentBrut, LocalDate date) {}

    record ParseResult(LocalDate data, List<ParsedLine> lines) {}

    private static final Map<String, Integer> LUNI = Map.ofEntries(
        Map.entry("ianuarie",   1), Map.entry("februarie",  2), Map.entry("martie",    3),
        Map.entry("aprilie",    4), Map.entry("mai",        5), Map.entry("iunie",     6),
        Map.entry("iulie",      7), Map.entry("august",     8), Map.entry("septembrie",9),
        Map.entry("octombrie", 10), Map.entry("noiembrie", 11), Map.entry("decembrie", 12)
    );

    // Matches a time token: 9:30 / 09:30 / 9.30 / 9h30 anywhere in text
    private static final Pattern TIME_TOKEN = Pattern.compile("\\b(\\d{1,2})[:.h](\\d{2})\\b");

    private static final Pattern DATE_PATTERN = Pattern.compile("(\\d{1,2})\\s+(\\w+)\\s+(\\d{4})");

    // Dash variants used as name/treatment separator
    private static final Pattern DASH_SEP = Pattern.compile("\\s+[-–—]+\\s*");

    public ParseResult parse(String rawText) {
        log.info("OCR raw text ({} chars):\n{}", rawText.length(), rawText);

        // Normalize: collapse multiple spaces, unify newlines
        String normalized = rawText
            .replaceAll("\r\n|\r", "\n")
            .replaceAll("[ \\t]+", " ")
            .trim();

        LocalDate defaultDate = extractDate(normalized);
        if (defaultDate == null) {
            defaultDate = LocalDate.now();
            log.warn("Data negăsită în imagine — se folosește azi: {}", defaultDate);
        }

        List<ParsedLine> lines = extractAppointments(normalized, defaultDate);

        if (lines.isEmpty()) {
            log.warn("Nicio programare detectată. Text complet:\n{}", normalized);
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "Nu s-au detectat programări în imaginea agendei. " +
                "Asigurați-vă că fiecare linie are formatul: ORA Nume - tratament");
        }

        return new ParseResult(defaultDate, lines);
    }

    /**
     * Token-based extraction. Tracks the current date header as it scans lines,
     * so appointments under "Luni, 8 iunie 2026" get June 8 and those under
     * "Marti, 9 iunie 2026" get June 9.
     */
    private List<ParsedLine> extractAppointments(String text, LocalDate defaultDate) {
        List<ParsedLine> result = new ArrayList<>();
        String[] allLines = text.split("\n");
        LocalDate currentDate = defaultDate;

        for (int i = 0; i < allLines.length; i++) {
            String line = allLines[i].trim();
            if (line.isBlank()) continue;

            // Update current date whenever a date header is encountered
            LocalDate dateCandidate = extractDate(line);
            if (dateCandidate != null) {
                currentDate = dateCandidate;
                continue;
            }

            Matcher tm = TIME_TOKEN.matcher(line);
            if (!tm.find() || tm.start() > 2) continue;

            LocalTime oraStart = buildTime(tm.group(1), tm.group(2));
            if (oraStart == null) continue;

            String rest = line.substring(tm.end()).replaceAll("^[:;,\\s]+", "").trim();

            if (rest.isBlank()) {
                if (i + 1 < allLines.length) {
                    String nextLine = allLines[i + 1].trim();
                    if (!nextLine.isBlank() && !nextLine.equals("-") && !nextLine.equals("–")
                            && !TIME_TOKEN.matcher(nextLine).find()) {
                        rest = nextLine;
                        i++;
                    }
                }
            } else if (!rest.contains("-") && !rest.contains("–") && !rest.contains("—")) {
                int j = i + 1;
                while (j < allLines.length && allLines[j].trim().isBlank()) j++;
                if (j < allLines.length) {
                    String nextLine = allLines[j].trim();
                    if (nextLine.startsWith("-") || nextLine.startsWith("–") || nextLine.startsWith("—")) {
                        String treatment = nextLine.replaceAll("^[-–—\\s]+", "").trim();
                        if (!treatment.isBlank()) {
                            rest = rest + " - " + treatment;
                            i = j;
                        }
                    }
                }
            }

            if (rest.isBlank()) continue;

            String[] parts   = DASH_SEP.split(rest, 2);
            String name      = parts[0].trim();
            String treatment = parts.length > 1 ? parts[1].trim() : "";
            if (name.isBlank()) continue;
            result.add(new ParsedLine(name, oraStart, treatment, currentDate));
        }

        // Pass 2 fallback (no line structure): scan raw text for time tokens
        if (result.isEmpty()) {
            Matcher tm = TIME_TOKEN.matcher(text);
            List<int[]> positions = new ArrayList<>();
            while (tm.find()) positions.add(new int[]{ tm.start(), tm.end(), Integer.parseInt(tm.group(1)), Integer.parseInt(tm.group(2)) });

            for (int i = 0; i < positions.size(); i++) {
                int[] pos      = positions.get(i);
                LocalTime oraStart = buildTime(String.valueOf(pos[2]), String.format("%02d", pos[3]));
                if (oraStart == null) continue;

                int contentEnd = i + 1 < positions.size() ? positions.get(i + 1)[0] : text.length();
                String rest    = text.substring(pos[1], contentEnd)
                                     .replaceAll("\\n", " ").replaceAll("[ \\t]+", " ")
                                     .replaceAll("^[:;,\\s]+", "").trim();
                if (rest.isBlank()) continue;

                String[] parts   = DASH_SEP.split(rest, 2);
                String name      = parts[0].trim();
                String treatment = parts.length > 1 ? parts[1].trim() : "";
                if (name.isBlank()) continue;
                result.add(new ParsedLine(name, oraStart, treatment, defaultDate));
            }
        }

        return result;
    }

    private LocalDate extractDate(String text) {
        Matcher m = DATE_PATTERN.matcher(text);
        while (m.find()) {
            int zi   = Integer.parseInt(m.group(1));
            int luna = LUNI.getOrDefault(m.group(2).toLowerCase(), -1);
            if (luna == -1) continue;
            int an   = Integer.parseInt(m.group(3));
            try { return LocalDate.of(an, luna, zi); } catch (Exception ignored) {}
        }
        return null;
    }

    private static LocalTime buildTime(String hour, String minute) {
        try {
            int h = Integer.parseInt(hour);
            int m = Integer.parseInt(minute);
            if (h > 23 || m > 59) return null;
            return LocalTime.of(h, m);
        } catch (Exception e) {
            return null;
        }
    }
}
