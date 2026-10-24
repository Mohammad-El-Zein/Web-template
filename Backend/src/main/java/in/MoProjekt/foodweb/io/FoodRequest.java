package in.MoProjekt.foodweb.io;

import java.util.HashMap;
import java.util.Map;

import lombok.Data;

@Data
public class FoodRequest {

    // Texte pro Sprache, z. B. { "de": "...", "en": "...", "ar": "..." }
    private Map<String, String> name = new HashMap<>();
    private Map<String, String> description = new HashMap<>();
    private String category;
    private double price;

    // Ältere Clients schicken name/description als einfachen deutschen Text
    public void setName(Object value) {
        this.name = toLanguageMap(value);
    }

    public void setDescription(Object value) {
        this.description = toLanguageMap(value);
    }

    private static Map<String, String> toLanguageMap(Object value) {
        Map<String, String> result = new HashMap<>();
        if (value instanceof Map<?, ?> map) {
            map.forEach((key, text) -> {
                if (key != null && text != null) {
                    result.put(key.toString(), text.toString());
                }
            });
        } else if (value != null) {
            result.put("de", value.toString());
        }
        return result;
    }
}
