package in.MoProjekt.foodweb.migration;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import in.MoProjekt.foodweb.entity.CategoryEntity;
import in.MoProjekt.foodweb.entity.FoodEntity;
import in.MoProjekt.foodweb.io.CategoryRequest;
import in.MoProjekt.foodweb.repository.CategoryRepository;
import in.MoProjekt.foodweb.repository.FoodRepository;
import in.MoProjekt.foodweb.service.CategoryService;
import in.MoProjekt.foodweb.service.CategoryServiceImpl;
import lombok.RequiredArgsConstructor;

// Legt die Standard-Kategorien an (nur wenn noch keine existieren) und setzt categoryId bei alten Gerichten.
// Läuft als ApplicationRunner vor ApplicationReadyEvent, also bevor FoodMigrationRunner Gerichte lädt und speichert.
// Mehrfaches Ausführen ist unbedenklich.
@Component
@RequiredArgsConstructor
public class CategoryMigrationRunner implements ApplicationRunner {

    private final CategoryRepository categoryRepository;
    private final FoodRepository foodRepository;
    private final CategoryService categoryService;

    @Override
    public void run(ApplicationArguments args) {
        try {
            migrate();
        } catch (Exception ex) {
            System.out.println("Category migration failed: " + ex.getMessage());
        }
    }

    void migrate() {
        if (categoryRepository.count() == 0) {
            categoryRepository.saveAll(defaultCategories());
            System.out.println("✔ Default categories created");
        }

        Map<String, CategoryEntity> categories = categoryService.categoriesById();
        int updated = 0;
        for (FoodEntity food : foodRepository.findAll()) {
            if (food.getCategoryId() != null && categories.containsKey(food.getCategoryId())) {
                continue;
            }
            String legacyName = food.getCategory();
            if (legacyName == null || legacyName.isBlank()) {
                System.out.println("Food " + food.getId() + " has no category");
                continue;
            }
            try {
                // Unbekannter Text -> eigene Kategorie (en/ar werden übersetzt)
                String categoryId = categoryService.findByNameOrSlug(legacyName)
                        .map(CategoryEntity::getId)
                        .orElseGet(() -> createCategory(legacyName));
                food.setCategoryId(categoryId);
                foodRepository.save(food);
                updated++;
            } catch (Exception ex) {
                System.out.println("Category migration failed for food " + food.getId() + ": " + ex.getMessage());
            }
        }
        System.out.println("✔ Category migration complete! Updated foods: " + updated);
    }

    private String createCategory(String germanName) {
        Map<String, String> name = new LinkedHashMap<>();
        name.put("de", germanName.trim());
        return categoryService.addCategory(CategoryRequest.builder().name(name).build()).getId();
    }

    static List<CategoryEntity> defaultCategories() {
        List<CategoryEntity> categories = new ArrayList<>();
        categories.add(category("Pizza", "Pizza", "بيتزا"));
        categories.add(category("Pasta", "Pasta", "معكرونة"));
        categories.add(category("Burger", "Burger", "برغر"));
        categories.add(category("Arabisches", "Arabic", "مأكولات عربية"));
        categories.add(category("Salat", "Salad", "سلطة"));
        categories.add(category("Dessert", "Dessert", "حلويات"));
        categories.add(category("Getränke", "Drinks", "مشروبات"));
        for (int i = 0; i < categories.size(); i++) {
            categories.get(i).setSortOrder(i);
        }
        return categories;
    }

    private static CategoryEntity category(String de, String en, String ar) {
        Map<String, String> name = new LinkedHashMap<>();
        name.put("de", de);
        name.put("en", en);
        name.put("ar", ar);
        return CategoryEntity.builder()
                .name(name)
                .slug(CategoryServiceImpl.slugify(de))
                .imageUrl("")
                .active(true)
                .build();
    }
}
