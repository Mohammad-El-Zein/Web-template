package in.MoProjekt.foodweb.entity;


import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "foods")
public class FoodEntity {

    @Id
    private String id;

    private Object name;        
    private Object description; 

    // Verweis auf die Kategorie; category enthält zusätzlich deren deutschen Namen (für ältere Clients und Bestellungen)
    private String categoryId;
    private String category;

    private double price;
    private String imageUrl;
}