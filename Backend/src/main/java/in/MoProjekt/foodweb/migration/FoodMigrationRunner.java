package in.MoProjekt.foodweb.migration;

import in.MoProjekt.foodweb.entity.FoodEntity;
import in.MoProjekt.foodweb.repository.FoodRepository;
import in.MoProjekt.foodweb.service.OpenAITranslationService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

// Ergänzt fehlende Übersetzungen (en, ar) aller Gerichte. Läuft nach dem Start im Hintergrund,
// damit der Server nicht auf OpenAI warten muss.
@Component
@RequiredArgsConstructor
public class FoodMigrationRunner {

    private final FoodRepository foodRepo;
    private final OpenAITranslationService translator;

    @EventListener(ApplicationReadyEvent.class)
    public void startMigration() {
        Thread thread = new Thread(this::migrate, "food-translation-migration");
        thread.setDaemon(true);
        thread.start();
    }

    void migrate() {
        int updated = 0;
        for (FoodEntity food : foodRepo.findAll()) {
            try {
                Map<String, String> name = toMap(food.getName());
                Map<String, String> description = toMap(food.getDescription());

                boolean changed = addMissingTranslations(name) | addMissingTranslations(description);
                if (changed || !(food.getName() instanceof Map) || !(food.getDescription() instanceof Map)) {
                    food.setName(name);
                    food.setDescription(description);
                    foodRepo.save(food);
                    updated++;
                }
            } catch (Exception ex) {
                System.out.println("Migration failed for food " + food.getId() + ": " + ex.getMessage());
            }
        }
        System.out.println("✔ Migration complete! Updated foods: " + updated);
    }

    private boolean addMissingTranslations(Map<String, String> texts) {
        String de = texts.get("de");
        if (de == null || de.isBlank()) {
            return false;
        }
        boolean changed = false;
        for (Map.Entry<String, String> language : OpenAITranslationService.LANGUAGES.entrySet()) {
            String existing = texts.get(language.getKey());
            if (existing == null || existing.isBlank()) {
                texts.put(language.getKey(), translator.translate(de, language.getValue()));
                changed = true;
            }
        }
        return changed;
    }

    // Alte Einträge haben name/description als einfachen deutschen String
    private Map<String, String> toMap(Object value) {
        Map<String, String> result = new HashMap<>();
        if (value instanceof Map<?, ?> map) {
            map.forEach((key, text) -> {
                if (key != null && text != null) {
                    result.put(key.toString(), text.toString());
                }
            });
        } else if (value instanceof String text) {
            result.put("de", text);
        }
        return result;
    }
}
