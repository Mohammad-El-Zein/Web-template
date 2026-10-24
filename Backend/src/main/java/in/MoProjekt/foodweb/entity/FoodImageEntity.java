package in.MoProjekt.foodweb.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// Bild eines Gerichts, direkt in MongoDB gespeichert (Ersatz, wenn S3 nicht verfügbar ist)
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "food_images")
public class FoodImageEntity {
    @Id
    private String id;
    private String contentType;
    private byte[] data;
}
