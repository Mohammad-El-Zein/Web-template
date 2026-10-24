package in.MoProjekt.foodweb.io;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CategoryResponse {

    private String id;
    // Alle Sprachen (lang=all) oder nur die gewünschte, z. B. { "ar": "مشروبات" }
    private Map<String, String> name;
    private String slug;
    private String imageUrl;
    private int sortOrder;
    private boolean active;
}
