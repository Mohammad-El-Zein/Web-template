package in.MoProjekt.foodweb.migration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import in.MoProjekt.foodweb.entity.CategoryEntity;
import in.MoProjekt.foodweb.entity.FoodEntity;
import in.MoProjekt.foodweb.repository.CategoryRepository;
import in.MoProjekt.foodweb.repository.FoodRepository;
import in.MoProjekt.foodweb.service.CategoryServiceImpl;
import in.MoProjekt.foodweb.service.OpenAITranslationService;
import in.MoProjekt.foodweb.service.TranslationHelper;
import in.MoProjekt.foodweb.storage.ImageStorage;

// Simuliert MongoDB mit einer Liste, damit ein zweiter Lauf den Stand des ersten sieht
@ExtendWith(MockitoExtension.class)
class CategoryMigrationRunnerTest {

    @Mock private CategoryRepository categoryRepository;
    @Mock private FoodRepository foodRepository;
    @Mock private OpenAITranslationService translator;
    @Mock private ImageStorage imageStorage;

    private final List<CategoryEntity> storedCategories = new ArrayList<>();
    private CategoryMigrationRunner runner;

    @BeforeEach
    void setUp() {
        CategoryServiceImpl categoryService = new CategoryServiceImpl(categoryRepository, foodRepository,
                new TranslationHelper(translator), imageStorage);
        runner = new CategoryMigrationRunner(categoryRepository, foodRepository, categoryService);

        org.mockito.Mockito.lenient().when(categoryRepository.count()).thenAnswer(inv -> (long) storedCategories.size());
        org.mockito.Mockito.lenient().when(categoryRepository.findAll()).thenAnswer(inv -> new ArrayList<>(storedCategories));
        org.mockito.Mockito.lenient().when(categoryRepository.findAllByOrderBySortOrderAsc())
                .thenAnswer(inv -> new ArrayList<>(storedCategories));
        org.mockito.Mockito.lenient().when(categoryRepository.saveAll(any())).thenAnswer(inv -> {
            Iterable<CategoryEntity> categories = inv.getArgument(0);
            categories.forEach(this::store);
            return categories;
        });
        org.mockito.Mockito.lenient().when(categoryRepository.save(any())).thenAnswer(inv -> store(inv.getArgument(0)));
    }

    private CategoryEntity store(CategoryEntity category) {
        if (category.getId() == null) {
            category.setId("c" + (storedCategories.size() + 1));
        }
        storedCategories.add(category);
        return category;
    }

    private FoodEntity food(String id, String category) {
        return FoodEntity.builder().id(id).category(category).name(Map.of("de", id)).build();
    }

    @Test
    void defaultCategoriesAreCreatedInOrderWithAllLanguages() {
        when(foodRepository.findAll()).thenReturn(List.of());

        runner.migrate();

        assertEquals(7, storedCategories.size());
        List<String> germanNames = storedCategories.stream().map(c -> c.getName().get("de")).toList();
        assertEquals(List.of("Pizza", "Pasta", "Burger", "Arabisches", "Salat", "Dessert", "Getränke"), germanNames);
        CategoryEntity drinks = storedCategories.get(6);
        assertEquals("getraenke", drinks.getSlug());
        assertEquals(6, drinks.getSortOrder());
        assertEquals(Map.of("de", "Getränke", "en", "Drinks", "ar", "مشروبات"), drinks.getName());
        assertEquals("مأكولات عربية", storedCategories.get(3).getName().get("ar"));
        assertEquals(true, drinks.isActive());
        // Standard-Kategorien haben alle Sprachen, also keine Übersetzung
        verify(translator, never()).translate(any(), any());
    }

    @Test
    void foodsGetCategoryIdAndSecondRunChangesNothing() {
        FoodEntity pizza = food("f1", "Pizza");
        FoodEntity cola = food("f2", "Getränke");
        FoodEntity salad = food("f3", "salat");
        FoodEntity noCategory = food("f4", null);
        when(foodRepository.findAll()).thenReturn(List.of(pizza, cola, salad, noCategory));

        runner.migrate();

        assertEquals("c1", pizza.getCategoryId());
        assertEquals("c7", cola.getCategoryId());
        assertEquals("c5", salad.getCategoryId());
        assertEquals(null, noCategory.getCategoryId());
        verify(foodRepository, org.mockito.Mockito.times(3)).save(any());

        // Zweiter Lauf: keine neuen Kategorien, keine gespeicherten Gerichte
        runner.migrate();

        assertEquals(7, storedCategories.size());
        verify(categoryRepository, org.mockito.Mockito.times(1)).saveAll(any());
        verify(foodRepository, org.mockito.Mockito.times(3)).save(any());
    }

    @Test
    void deletedDefaultCategoriesAreNotRecreated() {
        storedCategories.add(CategoryEntity.builder().id("x1").slug("pizza")
                .name(new HashMap<>(Map.of("de", "Pizza"))).active(true).build());
        when(foodRepository.findAll()).thenReturn(List.of());

        runner.migrate();

        assertEquals(1, storedCategories.size());
        verify(categoryRepository, never()).saveAll(any());
    }

    @Test
    void unknownCategoryStringGetsOwnTranslatedCategory() {
        FoodEntity soup1 = food("f1", "Suppe");
        FoodEntity soup2 = food("f2", "Suppe");
        when(foodRepository.findAll()).thenReturn(List.of(soup1, soup2));
        when(translator.translate("Suppe", "English")).thenReturn("Soup");
        when(translator.translate("Suppe", "Arabic")).thenReturn("شوربة");

        runner.migrate();

        assertEquals(8, storedCategories.size());
        CategoryEntity soup = storedCategories.get(7);
        assertEquals("suppe", soup.getSlug());
        assertEquals(7, soup.getSortOrder());
        assertEquals(Map.of("de", "Suppe", "en", "Soup", "ar", "شوربة"), soup.getName());
        // Zweites Gericht nutzt dieselbe neue Kategorie
        assertEquals(soup.getId(), soup1.getCategoryId());
        assertEquals(soup.getId(), soup2.getCategoryId());
    }

    @Test
    void foodWithUnknownCategoryIdIsRemapped() {
        FoodEntity pizza = FoodEntity.builder().id("f1").categoryId("geloescht").category("Pizza").build();
        when(foodRepository.findAll()).thenReturn(List.of(pizza));

        runner.migrate();

        assertEquals("c1", pizza.getCategoryId());
        ArgumentCaptor<FoodEntity> saved = ArgumentCaptor.forClass(FoodEntity.class);
        verify(foodRepository).save(saved.capture());
        assertEquals("c1", saved.getValue().getCategoryId());
        assertEquals("Pizza", saved.getValue().getCategory());
    }
}
