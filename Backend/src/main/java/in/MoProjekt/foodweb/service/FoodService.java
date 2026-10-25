package in.MoProjekt.foodweb.service;

import java.util.List;
import java.util.Map;

import org.springframework.web.multipart.MultipartFile;

import in.MoProjekt.foodweb.entity.FoodImageEntity;
import in.MoProjekt.foodweb.io.FoodRequest;
import in.MoProjekt.foodweb.io.FoodResponse;

public interface FoodService {

    FoodResponse addFood(FoodRequest request, MultipartFile file);

    List<FoodResponse> readFoods(String lang);

    FoodResponse readFood(String id, String lang);

    void deleteFood(String id);

    FoodImageEntity readImage(String id);

    FoodResponse updateFood(String id, FoodRequest request, MultipartFile file);

    // Deutscher Text -> { de, en, ar }
    Map<String, String> translate(String germanText);

    // Text in der Sprache sourceLang (de, en, ar) -> { de, en, ar }, z. B. für Bewertungen
    Map<String, String> translate(String text, String sourceLang);
}