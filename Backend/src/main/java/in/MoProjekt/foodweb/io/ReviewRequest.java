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
public class ReviewRequest {

    private String authorName;
    // Texte pro Sprache; mindestens eine Sprache, fehlende werden aus der ersten ausgefüllten übersetzt
    @Builder.Default
    private Map<String, String> text = new HashMap<>();
    private Integer rating;
    private String photoUrl;
    private String source;
    // "YYYY-MM-DD" oder leer (als Text, damit ein falsches Format als REVIEW_INVALID gemeldet wird)
    private String date;
    // null = beim Anlegen sichtbar, beim Bearbeiten unverändert
    private Boolean visible;
}
