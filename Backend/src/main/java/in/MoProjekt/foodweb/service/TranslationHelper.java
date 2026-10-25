package in.MoProjekt.foodweb.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

// Gemeinsame Logik für mehrsprachige Texte (Gerichte, Kategorien, Bewertungen)
@Component
@RequiredArgsConstructor
public class TranslationHelper {

    private static final long TRANSLATION_TIMEOUT_SECONDS = 20;
    // Reihenfolge, in der die Ausgangssprache gewählt wird
    public static final List<String> SOURCE_PRIORITY = List.of("de", "en", "ar");

    private final OpenAITranslationService translator;

    // Leere Sprachen per KI aus dem Deutschen übersetzen (falls OpenAI nicht erreichbar: leer lassen)
    public Map<String, String> completeTranslations(Map<String, String> texts) {
        Map<String, String> result = filled(texts);
        String de = result.getOrDefault("de", "");
        if (de.isEmpty()) {
            return result;
        }
        for (Map.Entry<String, String> language : OpenAITranslationService.LANGUAGES.entrySet()) {
            if (!result.containsKey(language.getKey())) {
                translateInto(result, language.getKey(), () -> translator.translate(de, language.getValue()));
            }
        }
        return result;
    }

    // Leere Sprachen aus der ersten ausgefüllten Sprache (de, en, ar) übersetzen, z. B. für Bewertungen,
    // die nur auf Englisch oder Arabisch vorliegen. Schlägt nie fehl, im Zweifel bleibt die Sprache leer.
    public Map<String, String> completeTranslationsFromAny(Map<String, String> texts) {
        Map<String, String> result = filled(texts);
        String source = firstLanguage(result);
        if (source == null) {
            return result;
        }
        String sourceText = result.get(source);
        String sourceName = OpenAITranslationService.LANGUAGES.get(source);
        for (Map.Entry<String, String> language : OpenAITranslationService.LANGUAGES.entrySet()) {
            if (!result.containsKey(language.getKey())) {
                translateInto(result, language.getKey(),
                        () -> translator.translate(sourceText, sourceName, language.getValue()));
            }
        }
        return result;
    }

    // Erste ausgefüllte Sprache nach SOURCE_PRIORITY oder null
    public static String firstLanguage(Map<String, String> texts) {
        if (texts == null) {
            return null;
        }
        for (String lang : SOURCE_PRIORITY) {
            String text = texts.get(lang);
            if (text != null && !text.isBlank()) {
                return lang;
            }
        }
        return null;
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

    // Nur unterstützte Sprachen mit Text, getrimmt
    private Map<String, String> filled(Map<String, String> texts) {
        Map<String, String> result = new HashMap<>();
        if (texts != null) {
            texts.forEach((lang, text) -> {
                if (OpenAITranslationService.LANGUAGES.containsKey(lang) && text != null && !text.isBlank()) {
                    result.put(lang, text.trim());
                }
            });
        }
        return result;
    }

    // höchstens 20 Sekunden auf OpenAI warten, sonst ohne Übersetzung speichern
    private void translateInto(Map<String, String> result, String lang, Supplier<String> translation) {
        try {
            String translated = CompletableFuture.supplyAsync(translation).get(TRANSLATION_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (translated != null && !translated.isBlank()) {
                result.put(lang, translated.trim());
            }
        } catch (Exception ex) {
            System.out.println("Translation to " + OpenAITranslationService.LANGUAGES.get(lang) + " failed: " + ex.getMessage());
        }
    }
}
