package in.MoProjekt.foodweb.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// Bild direkt in MongoDB gespeichert (wenn R2 nicht eingerichtet oder nicht erreichbar ist), siehe MongoImageStorage
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
