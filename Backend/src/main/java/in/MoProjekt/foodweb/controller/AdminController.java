package in.MoProjekt.foodweb.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import in.MoProjekt.foodweb.service.FoodService;
import in.MoProjekt.foodweb.service.OpenAITranslationService;
import lombok.AllArgsConstructor;

// Nur für Admins (siehe SecurityConfig: /api/admin/**)
@RestController
@RequestMapping("/api/admin")
@AllArgsConstructor
public class AdminController {

    private static final int MAX_TEXT_LENGTH = 2000;

    private final FoodService foodService;

    // { "text": "deutscher Text" } -> { "de": ..., "en": ..., "ar": ... }
    // Optional "from": "en" | "ar" | "de" -> allgemeine Übersetzung aus dieser Sprache (z. B. Bewertungen)
    @PostMapping("/translate")
    public Map<String, String> translate(@RequestBody Map<String, String> body) {
        String text = body.get("text");
        if (text == null || text.isBlank() || text.length() > MAX_TEXT_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid text");
        }
        String from = body.get("from");
        if (from == null) {
            return foodService.translate(text);
        }
        if (!OpenAITranslationService.LANGUAGES.containsKey(from)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid language");
        }
        return foodService.translate(text, from);
    }
}
