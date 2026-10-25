package in.MoProjekt.foodweb.io;

import java.time.LocalDate;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReviewResponse {

    private String id;
    private String authorName;
    // Alle Sprachen (Admin, lang=all) oder nur die gewünschte, z. B. { "ar": "..." }
    private Map<String, String> text;
    private int rating;
    private String photoUrl;
    private String source;
    private LocalDate date;
    private boolean visible;
    private int sortOrder;
}
