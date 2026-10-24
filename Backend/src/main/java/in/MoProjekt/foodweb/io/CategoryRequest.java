package in.MoProjekt.foodweb.io;

import java.util.HashMap;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CategoryRequest {

    // Texte pro Sprache, fehlende Sprachen werden aus dem Deutschen übersetzt
    @Builder.Default
    private Map<String, String> name = new HashMap<>();
    private String imageUrl;
    // null = beim Anlegen aktiv, beim Bearbeiten unverändert
    private Boolean active;
}
