package in.MoProjekt.foodweb.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import in.MoProjekt.foodweb.entity.CategoryEntity;
import in.MoProjekt.foodweb.io.CategoryRequest;
import in.MoProjekt.foodweb.io.CategoryResponse;

public interface CategoryService {

    // Nur aktive, sortiert; lang=all liefert alle Sprachen
    List<CategoryResponse> readActiveCategories(String lang);

    // Für das Admin-Panel: alle, auch inaktive
    List<CategoryResponse> readAllCategories();

    CategoryResponse addCategory(CategoryRequest request);

    CategoryResponse updateCategory(String id, CategoryRequest request);

    void deleteCategory(String id);

    // ids in neuer Reihenfolge, muss jede Kategorie genau einmal enthalten
    List<CategoryResponse> reorder(List<String> ids);

    // Kategorie für ein Gericht: categoryId oder alter Text (deutscher Name oder Slug)
    CategoryEntity resolveForFood(String categoryId, String legacyName);

    Optional<CategoryEntity> findByNameOrSlug(String text);

    Map<String, CategoryEntity> categoriesById();
}
