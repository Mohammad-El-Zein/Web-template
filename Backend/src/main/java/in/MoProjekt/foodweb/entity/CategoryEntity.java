package in.MoProjekt.foodweb.entity;

import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "categories")
public class CategoryEntity {

    @Id
    private String id;

    // { "de": "Getränke", "en": "Drinks", "ar": "مشروبات" }
    private Map<String, String> name;

    // Aus dem deutschen Namen erzeugt, bleibt bei Umbenennung gleich (z. B. "getraenke")
    @Indexed(unique = true)
    private String slug;

    private String imageUrl;
    private int sortOrder;
    private boolean active;
}
