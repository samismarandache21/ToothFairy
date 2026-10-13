package com.toothfairy.import_agenda;

import org.springframework.stereotype.Service;

import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class DurataService {

    public List<Integer> calculeazaDurate(List<ParserService.ParsedLine> lines) {
        List<Integer> durate = new ArrayList<>();

        for (int i = 0; i < lines.size(); i++) {
            boolean isLast = i == lines.size() - 1;
            boolean sameDay = !isLast && lines.get(i).date().equals(lines.get(i + 1).date());

            if (!isLast && sameDay) {
                long min = ChronoUnit.MINUTES.between(lines.get(i).oraStart(), lines.get(i + 1).oraStart());
                durate.add(min <= 0 || min > 90 ? -1 : (int) min);
            } else {
                // Last appointment of the day or last overall → use running average
                int medie = (int) Math.round(mediaDurata(durate));
                durate.add(medie > 0 ? medie : 30);
            }
        }

        return durate;
    }

    public long numarPauze(List<Integer> durate) {
        return durate.stream().filter(d -> d == -1).count();
    }

    public double mediaDurata(List<Integer> durate) {
        return durate.stream()
            .filter(d -> d != -1)
            .mapToInt(Integer::intValue)
            .average()
            .orElse(0.0);
    }
}
