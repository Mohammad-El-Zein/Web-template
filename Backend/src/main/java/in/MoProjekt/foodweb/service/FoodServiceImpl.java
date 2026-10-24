package in.MoProjekt.foodweb.service;

import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import in.MoProjekt.foodweb.entity.CategoryEntity;
import in.MoProjekt.foodweb.entity.FoodEntity;
import in.MoProjekt.foodweb.entity.FoodImageEntity;
import in.MoProjekt.foodweb.io.FoodRequest;
import in.MoProjekt.foodweb.io.FoodResponse;
import in.MoProjekt.foodweb.repository.FoodRepository;
import in.MoProjekt.foodweb.storage.ImageFiles;
import in.MoProjekt.foodweb.storage.ImageStorage;
import in.MoProjekt.foodweb.storage.MongoImageStorage;

@Service
public class FoodServiceImpl implements FoodService {

    private static final String IMAGE_FOLDER = "foods";

    @Autowired
    private FoodRepository foodRepository;

    @Autowired
    private TranslationHelper translationHelper;

    @Autowired
    private CategoryService categoryService;

    // Aktiver Speicher (R2 oder MongoDB), siehe ImageStorageConfig
    @Autowired
    private ImageStorage imageStorage;

    // Für ältere Bilder, die über GET /api/foods/images/{id} ausgeliefert werden
    @Autowired
    private MongoImageStorage mongoImageStorage;

    private static final String ALL_LANGUAGES = "all";

    private FoodResponse convertToResponse(FoodEntity entity, Map<String, CategoryEntity> categories){
    return FoodResponse.builder()
            .id(entity.getId())
            .name(entity.getName())               // komplette Map
            .description(entity.getDescription()) // komplette Map
            .price(entity.getPrice())
            .category(categoryName(entity, categories))
            .categoryId(entity.getCategoryId())
            .imageUrl(entity.getImageUrl())
            .build();
}

    // Aktueller deutscher Name der Kategorie, sonst der gespeicherte Text
    private String categoryName(FoodEntity entity, Map<String, CategoryEntity> categories) {
        CategoryEntity category = entity.getCategoryId() != null ? categories.get(entity.getCategoryId()) : null;
        if (category != null && category.getName() != null && category.getName().get("de") != null) {
            return category.getName().get("de");
        }
        return entity.getCategory();
    }


    @Override
public List<FoodResponse> readFoods(String lang) {
    // Kategorien einmal laden statt pro Gericht
    Map<String, CategoryEntity> categories = categoryService.categoriesById();
    // lang=all liefert alle Sprachen (für das Admin-Panel)
    return foodRepository.findAll().stream()
            .map(food -> ALL_LANGUAGES.equals(lang) ? convertToResponse(food, categories) : convertToResponse(food, lang, categories))
            .collect(Collectors.toList());
}


   @Override
public FoodResponse readFood(String id, String lang) {
    FoodEntity entity = foodRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Food not found"));
    Map<String, CategoryEntity> categories = categoryService.categoriesById();
    return ALL_LANGUAGES.equals(lang) ? convertToResponse(entity, categories) : convertToResponse(entity, lang, categories);
}


    @Override
public void deleteFood(String id) {

    // hole deutsche Version, reicht für delete
    FoodResponse response = readFood(id, "de");

    // Fehler beim Löschen des Bildes werden nur geloggt, das Gericht wird trotzdem gelöscht
    imageStorage.delete(response.getImageUrl());
    foodRepository.deleteById(id);
}


    @SuppressWarnings("unchecked")
private Map<String, String> cast(Object obj) {
    if (obj instanceof Map<?, ?> map) {
        return (Map<String, String>) map;
    }
    return Map.of();
}

private FoodResponse convertToResponse(FoodEntity entity, String lang, Map<String, CategoryEntity> categories) {

    Map<String, String> nameMap = cast(entity.getName());
    Map<String, String> descMap = cast(entity.getDescription());

    String name = TranslationHelper.textFor(nameMap, lang);
    String desc = TranslationHelper.textFor(descMap, lang);

    return FoodResponse.builder()
        .id(entity.getId())
        .name(Map.of(lang, name))
        .description(Map.of(lang, desc))
        .price(entity.getPrice())
        .category(categoryName(entity, categories))
        .categoryId(entity.getCategoryId())
        .imageUrl(entity.getImageUrl())
        .build();
}



    @Override
public FoodResponse addFood(FoodRequest request, MultipartFile file) {
    // Erst alles prüfen, dann Bild hochladen (sonst bleiben Bilder ohne Gericht liegen)
    ImageFiles.check(file);
    validate(request);
    CategoryEntity category = categoryService.resolveForFood(request.getCategoryId(), request.getCategory());
    String imageUrl = imageStorage.upload(file, IMAGE_FOLDER);

    FoodEntity entity = new FoodEntity();
    entity.setName(translationHelper.completeTranslations(request.getName()));
    entity.setDescription(translationHelper.completeTranslations(request.getDescription()));
    setCategory(entity, category);
    entity.setPrice(request.getPrice());
    entity.setImageUrl(imageUrl);

    FoodEntity saved = foodRepository.save(entity);

    return convertToResponse(saved, "de", Map.of(category.getId(), category));
}

    private void setCategory(FoodEntity entity, CategoryEntity category) {
        entity.setCategoryId(category.getId());
        entity.setCategory(category.getName() != null ? category.getName().get("de") : null);
    }

    @Override
    public FoodImageEntity readImage(String id) {
        return mongoImageStorage.read(id);
    }

    @Override
    public FoodResponse updateFood(String id, FoodRequest request, MultipartFile file) {
        // Bild ist beim Bearbeiten optional
        boolean newImage = file != null && !file.isEmpty();
        if (newImage) {
            ImageFiles.check(file);
        }
        validate(request);
        FoodEntity entity = foodRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Food not found"));
        CategoryEntity category = categoryService.resolveForFood(request.getCategoryId(), request.getCategory());

        if (newImage) {
            String oldImageUrl = entity.getImageUrl();
            entity.setImageUrl(imageStorage.upload(file, IMAGE_FOLDER));
            imageStorage.delete(oldImageUrl);
        }
        entity.setName(translationHelper.completeTranslations(request.getName()));
        entity.setDescription(translationHelper.completeTranslations(request.getDescription()));
        setCategory(entity, category);
        entity.setPrice(request.getPrice());

        return convertToResponse(foodRepository.save(entity), Map.of(category.getId(), category));
    }

    @Override
    public Map<String, String> translate(String germanText) {
        return translationHelper.completeTranslations(Map.of("de", germanText));
    }

    private void validate(FoodRequest request) {
        String germanName = request.getName().get("de");
        if (germanName == null || germanName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "German name is required");
        }
        if (request.getPrice() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Price must not be negative");
        }
    }


}