package in.MoProjekt.foodweb.entity;

import java.time.LocalDate;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// Echte Kundenbewertung, im Admin-Panel gepflegt (keine Startdaten)
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "reviews")
public class ReviewEntity {

    @Id
    private String id;

    private String authorName;

    // { "de": ..., "en": ..., "ar": ... }, mindestens eine Sprache ausgefüllt
    private Map<String, String> text;

    // 1 bis 5 Sterne
    private int rating;

    private String photoUrl;

    // Woher die Bewertung stammt, z. B. "Google" (optional)
    private String source;

    // Datum der Bewertung (optional)
    private LocalDate date;

    private boolean visible;
    private int sortOrder;
}
