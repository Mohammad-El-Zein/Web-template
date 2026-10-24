package in.MoProjekt.foodweb.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

// Gemeinsame Logik für mehrsprachige Texte (Gerichte, Kategorien)
@Component
@RequiredArgsConstructor
public class TranslationHelper {

    private static final long TRANSLATION_TIMEOUT_SECONDS = 20;

    private final OpenAITranslationService translator;

    // Leere Sprachen per KI aus dem Deutschen übersetzen (falls OpenAI nicht erreichbar: leer lassen)
    public Map<String, String> completeTranslations(Map<String, String> texts) {
        Map<String, String> result = new HashMap<>();
        if (texts == null) {
            return result;
        }
        texts.forEach((lang, text) -> {
            if (OpenAITranslationService.LANGUAGES.containsKey(lang) && text != null && !text.isBlank()) {
                result.put(lang, text.trim());
            }
        });
        String de = result.getOrDefault("de", "");
        if (de.isEmpty()) {
            return result;
        }
        for (Map.Entry<String, String> language : OpenAITranslationService.LANGUAGES.entrySet()) {
            if (result.containsKey(language.getKey())) {
                continue;
            }
            try {
                // höchstens 20 Sekunden auf OpenAI warten, sonst ohne Übersetzung speichern
                String translated = CompletableFuture.supplyAsync(() -> translator.translate(de, language.getValue()))
                        .get(TRANSLATION_TIMEOUT_SECONDS, TimeUnit.SECONDS);
                if (translated != null && !translated.isBlank()) {
                    result.put(language.getKey(), translated.trim());
                }
            } catch (Exception ex) {
                System.out.println("Translation to " + language.getValue() + " failed: " + ex.getMessage());
            }
        }
        return result;
    }

    // Gewünschte Sprache, sonst Englisch, sonst Deutsch
    public static String textFor(Map<String, String> texts, String lang) {
        if (texts == null) {
            return "";
        }
        for (String candidate : List.of(lang, "en", "de")) {
            String text = texts.get(candidate);
            if (text != null && !text.isBlank()) {
                return text;
            }
        }
        return "";
    }
}
