package in.MoProjekt.foodweb.service;

import java.text.Normalizer;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import in.MoProjekt.foodweb.entity.CategoryEntity;
import in.MoProjekt.foodweb.entity.FoodEntity;
import in.MoProjekt.foodweb.exception.CategoryException;
import in.MoProjekt.foodweb.io.CategoryRequest;
import in.MoProjekt.foodweb.io.CategoryResponse;
import in.MoProjekt.foodweb.repository.CategoryRepository;
import in.MoProjekt.foodweb.repository.FoodRepository;
import in.MoProjekt.foodweb.storage.ImageStorage;
import in.MoProjekt.foodweb.util.UrlCheck;
import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private static final String ALL_LANGUAGES = "all";
    private static final int MAX_NAME_LENGTH = 100;
    private static final int MAX_SLUG_LENGTH = 60;
    private static final String FALLBACK_SLUG = "kategorie";

    private final CategoryRepository categoryRepository;
    private final FoodRepository foodRepository;
    private final TranslationHelper translationHelper;
    private final ImageStorage imageStorage;

    @Override
    public List<CategoryResponse> readActiveCategories(String lang) {
        return categoryRepository.findByActiveTrueOrderBySortOrderAsc().stream()
                .map(category -> ALL_LANGUAGES.equals(lang) ? convertToResponse(category) : convertToResponse(category, lang))
                .collect(Collectors.toList());
    }

    @Override
    public List<CategoryResponse> readAllCategories() {
        return categoryRepository.findAllByOrderBySortOrderAsc().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public CategoryResponse addCategory(CategoryRequest request) {
        validate(request);
        List<CategoryEntity> existing = categoryRepository.findAllByOrderBySortOrderAsc();
        // Neue Kategorie kommt ans Ende
        int sortOrder = existing.isEmpty() ? 0 : existing.get(existing.size() - 1).getSortOrder() + 1;

        Map<String, String> name = translationHelper.completeTranslations(request.getName());
        CategoryEntity category = CategoryEntity.builder()
                .name(name)
                .slug(uniqueSlug(slugify(name.get("de"))))
                .imageUrl(trimToEmpty(request.getImageUrl()))
                .sortOrder(sortOrder)
                .active(request.getActive() == null || request.getActive())
                .build();
        return convertToResponse(categoryRepository.save(category));
    }

    @Override
    public CategoryResponse updateCategory(String id, CategoryRequest request) {
        validate(request);
        CategoryEntity category = findById(id);
        String oldGermanName = category.getName() != null ? category.getName().get("de") : null;
        String oldImageUrl = category.getImageUrl();

        // Slug bleibt gleich, damit Links stabil bleiben
        category.setName(translationHelper.completeTranslations(request.getName()));
        category.setImageUrl(trimToEmpty(request.getImageUrl()));
        if (request.getActive() != null) {
            category.setActive(request.getActive());
        }
        CategoryEntity saved = categoryRepository.save(category);

        // Altes Bild löschen, wenn es ersetzt oder entfernt wurde
        if (oldImageUrl != null && !oldImageUrl.isBlank() && !oldImageUrl.equals(saved.getImageUrl())) {
            imageStorage.delete(oldImageUrl);
        }

        // Deutschen Namen auch bei den Gerichten aktualisieren (Feld category für ältere Clients)
        String newGermanName = saved.getName().get("de");
        if (!newGermanName.equals(oldGermanName)) {
            List<FoodEntity> foods = foodRepository.findByCategoryId(id);
            foods.forEach(food -> food.setCategory(newGermanName));
            if (!foods.isEmpty()) {
                foodRepository.saveAll(foods);
            }
        }
        return convertToResponse(saved);
    }

    @Override
    public void deleteCategory(String id) {
        CategoryEntity category = findById(id);
        long foodCount = foodRepository.countByCategoryId(id);
        if (foodCount > 0) {
            throw CategoryException.notEmpty(foodCount);
        }
        categoryRepository.deleteById(id);
        imageStorage.delete(category.getImageUrl());
    }

    @Override
    public List<CategoryResponse> reorder(List<String> ids) {
        List<CategoryEntity> categories = categoryRepository.findAllByOrderBySortOrderAsc();
        Map<String, CategoryEntity> byId = categories.stream()
                .collect(Collectors.toMap(CategoryEntity::getId, Function.identity()));
        if (ids == null || ids.size() != categories.size() || new HashSet<>(ids).size() != ids.size()
                || !byId.keySet().containsAll(ids)) {
            throw CategoryException.invalid("order", "Order must contain every category exactly once");
        }
        for (int i = 0; i < ids.size(); i++) {
            byId.get(ids.get(i)).setSortOrder(i);
        }
        categoryRepository.saveAll(categories);
        return readAllCategories();
    }

    @Override
    public CategoryEntity resolveForFood(String categoryId, String legacyName) {
        if (categoryId != null && !categoryId.isBlank()) {
            return categoryRepository.findById(categoryId)
                    .orElseThrow(() -> CategoryException.invalid("categoryId", "Unknown category"));
        }
        if (legacyName != null && !legacyName.isBlank()) {
            return findByNameOrSlug(legacyName)
                    .orElseThrow(() -> CategoryException.invalid("category", "Unknown category: " + legacyName));
        }
        throw CategoryException.invalid("categoryId", "Category is required");
    }

    // Vergleicht mit dem deutschen Namen (ohne Groß-/Kleinschreibung) oder dem Slug
    @Override
    public Optional<CategoryEntity> findByNameOrSlug(String text) {
        if (text == null || text.isBlank()) {
            return Optional.empty();
        }
        String wanted = text.trim();
        String wantedSlug = slugify(wanted);
        return categoryRepository.findAllByOrderBySortOrderAsc().stream()
                .filter(category -> (category.getName() != null && wanted.equalsIgnoreCase(category.getName().get("de")))
                        || wanted.equalsIgnoreCase(category.getSlug())
                        || wantedSlug.equals(category.getSlug()))
                .findFirst();
    }

    @Override
    public Map<String, CategoryEntity> categoriesById() {
        return categoryRepository.findAll().stream()
                .collect(Collectors.toMap(CategoryEntity::getId, Function.identity()));
    }

    // "Getränke & Säfte" -> "getraenke-saefte"
    public static String slugify(String text) {
        if (text == null) {
            return FALLBACK_SLUG;
        }
        String slug = text.trim().toLowerCase()
                .replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss");
        // Restliche Akzente entfernen (é -> e)
        slug = Normalizer.normalize(slug, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        slug = slug.replaceAll("[^a-z0-9]+", "-").replaceAll("(^-+)|(-+$)", "");
        if (slug.length() > MAX_SLUG_LENGTH) {
            slug = slug.substring(0, MAX_SLUG_LENGTH).replaceAll("-+$", "");
        }
        return slug.isEmpty() ? FALLBACK_SLUG : slug;
    }

    // Bei Kollision "-2", "-3", ... anhängen
    private String uniqueSlug(String base) {
        String slug = base;
        int counter = 2;
        while (categoryRepository.existsBySlug(slug)) {
            slug = base + "-" + counter++;
        }
        return slug;
    }

    private CategoryEntity findById(String id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
    }

    private void validate(CategoryRequest request) {
        if (request == null || request.getName() == null) {
            throw CategoryException.invalid("name.de", "German name is required");
        }
        String germanName = request.getName().get("de");
        if (germanName == null || germanName.isBlank()) {
            throw CategoryException.invalid("name.de", "German name is required");
        }
        for (Map.Entry<String, String> text : request.getName().entrySet()) {
            if (!OpenAITranslationService.LANGUAGES.containsKey(text.getKey())) {
                throw CategoryException.invalid("name", "Unsupported language: " + text.getKey());
            }
            if (text.getValue() != null && text.getValue().trim().length() > MAX_NAME_LENGTH) {
                throw CategoryException.invalid("name." + text.getKey(),
                        "Name is too long (max " + MAX_NAME_LENGTH + " characters)");
            }
        }
        if (!UrlCheck.isAllowed(request.getImageUrl())) {
            throw CategoryException.invalid("imageUrl",
                    "URL must start with http://, https:// or / (max " + UrlCheck.MAX_URL_LENGTH + " characters)");
        }
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private CategoryResponse convertToResponse(CategoryEntity category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .imageUrl(category.getImageUrl())
                .sortOrder(category.getSortOrder())
                .active(category.isActive())
                .build();
    }

    private CategoryResponse convertToResponse(CategoryEntity category, String lang) {
        CategoryResponse response = convertToResponse(category);
        response.setName(Map.of(lang, TranslationHelper.textFor(category.getName(), lang)));
        return response;
    }
}
