package com.toothfairy.import_agenda;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class NormalizareService {

    record NormalizareResult(String tratament, String note) {}

    private static final Map<String, String> ABREVIERI = Map.ofEntries(
        Map.entry("det",          "Detartraj"),
        Map.entry("det.",         "Detartraj"),
        Map.entry("detartraj",    "Detartraj"),
        Map.entry("ctrl",         "Control"),
        Map.entry("ctrl.",        "Control"),
        Map.entry("control",      "Control"),
        Map.entry("pl",           "Plombă"),
        Map.entry("pl.",          "Plombă"),
        Map.entry("plomba",       "Plombă"),
        Map.entry("plombă",       "Plombă"),
        Map.entry("extractie",    "Extracție"),
        Map.entry("extracție",    "Extracție"),
        Map.entry("extracţie",    "Extracție"),
        Map.entry("consultatie",  "Consultație"),
        Map.entry("consultație",  "Consultație"),
        Map.entry("consultaţie",  "Consultație"),
        Map.entry("rx",           "Radiografie"),
        Map.entry("radiografie",  "Radiografie")
    );

    private static final Set<String> CUVINTE_NOTE = Set.of(
        "mof", "pref", "post-op", "post", "op", "molar"
    );

    public NormalizareResult normalize(String tratamentBrut) {
        String[] tokens = tratamentBrut.split("[\\s,]+");

        List<String> tratamentePrincipale = new ArrayList<>();
        List<String> noteTokens           = new ArrayList<>();

        for (String token : tokens) {
            String lower = token.toLowerCase().replaceAll("\\.$", "");
            if (lower.isBlank()) continue;

            if (ABREVIERI.containsKey(lower)) {
                tratamentePrincipale.add(ABREVIERI.get(lower));
            } else if (CUVINTE_NOTE.contains(lower)) {
                noteTokens.add(token);
            }
        }

        // Keep original text if no abbreviation matched — don't force-default to Consultație
        String tratament = tratamentePrincipale.isEmpty()
            ? (tratamentBrut.isBlank() ? "Consultație" : tratamentBrut.trim())
            : tratamentePrincipale.get(0);

        List<String> noteExtra = tratamentePrincipale.size() > 1
            ? tratamentePrincipale.subList(1, tratamentePrincipale.size())
            : List.of();

        List<String> toateNotele = new ArrayList<>(noteExtra);
        toateNotele.addAll(noteTokens);

        String note = toateNotele.isEmpty() ? null : String.join(", ", toateNotele);

        return new NormalizareResult(tratament, note);
    }
}
