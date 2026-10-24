package in.MoProjekt.foodweb.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import in.MoProjekt.foodweb.entity.CategoryEntity;
import in.MoProjekt.foodweb.entity.FoodEntity;
import in.MoProjekt.foodweb.exception.CategoryException;
import in.MoProjekt.foodweb.io.CategoryRequest;
import in.MoProjekt.foodweb.io.CategoryResponse;
import in.MoProjekt.foodweb.repository.CategoryRepository;
import in.MoProjekt.foodweb.repository.FoodRepository;

@ExtendWith(MockitoExtension.class)
class CategoryServiceImplTest {

    @Mock private CategoryRepository categoryRepository;
    @Mock private FoodRepository foodRepository;
    @Mock private OpenAITranslationService translator;

    private CategoryServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new CategoryServiceImpl(categoryRepository, foodRepository, new TranslationHelper(translator));
    }

    private CategoryEntity category(String id, String de, String en, String ar, int sortOrder, boolean active) {
        Map<String, String> name = new HashMap<>();
        name.put("de", de);
        if (en != null) name.put("en", en);
        if (ar != null) name.put("ar", ar);
        return CategoryEntity.builder().id(id).name(name).slug(CategoryServiceImpl.slugify(de))
                .sortOrder(sortOrder).active(active).build();
    }

    private CategoryRequest request(String de, String en, String ar) {
        Map<String, String> name = new HashMap<>();
        name.put("de", de);
        if (en != null) name.put("en", en);
        if (ar != null) name.put("ar", ar);
        return CategoryRequest.builder().name(name).build();
    }

    @Test
    void slugIsGeneratedFromGermanName() {
        assertEquals("getraenke", CategoryServiceImpl.slugify("Getränke"));
        assertEquals("suesses-salziges", CategoryServiceImpl.slugify("  Süßes & Salziges! "));
        assertEquals("creme-brulee", CategoryServiceImpl.slugify("Crème Brûlée"));
        assertEquals("kategorie", CategoryServiceImpl.slugify("مشروبات"));
    }

    @Test
    void createAddsCategoryAtTheEndWithUniqueSlugAndTranslations() {
        when(categoryRepository.findAllByOrderBySortOrderAsc())
                .thenReturn(List.of(category("c1", "Pizza", "Pizza", "بيتزا", 0, true),
                        category("c7", "Getränke", "Drinks", "مشروبات", 6, true)));
        when(categoryRepository.existsBySlug("getraenke")).thenReturn(true);
        when(categoryRepository.existsBySlug("getraenke-2")).thenReturn(false);
        when(categoryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(translator.translate("Getränke", "English")).thenReturn("Drinks");
        when(translator.translate("Getränke", "Arabic")).thenReturn("مشروبات");

        CategoryResponse created = service.addCategory(request(" Getränke ", "", null));

        assertEquals("getraenke-2", created.getSlug());
        assertEquals(7, created.getSortOrder());
        assertTrue(created.isActive());
        assertEquals(Map.of("de", "Getränke", "en", "Drinks", "ar", "مشروبات"), created.getName());
    }

    @Test
    void failedTranslationKeepsLanguageEmpty() {
        when(categoryRepository.findAllByOrderBySortOrderAsc()).thenReturn(List.of());
        when(categoryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(translator.translate(anyString(), anyString())).thenThrow(new RuntimeException("OpenAI down"));

        CategoryResponse created = service.addCategory(request("Suppen", null, "شوربات"));

        assertEquals(Map.of("de", "Suppen", "ar", "شوربات"), created.getName());
        assertEquals(0, created.getSortOrder());
    }

    @Test
    void updateKeepsSlugAndRenamesFoods() {
        CategoryEntity drinks = category("c7", "Getränke", "Drinks", "مشروبات", 6, true);
        FoodEntity cola = FoodEntity.builder().id("f1").categoryId("c7").category("Getränke").build();
        when(categoryRepository.findById("c7")).thenReturn(Optional.of(drinks));
        when(categoryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(foodRepository.findByCategoryId("c7")).thenReturn(List.of(cola));

        CategoryRequest update = request("Getränke & Säfte", "Drinks & Juices", "مشروبات وعصائر");
        update.setActive(false);
        CategoryResponse updated = service.updateCategory("c7", update);

        assertEquals("getraenke", updated.getSlug());
        assertEquals("Getränke & Säfte", updated.getName().get("de"));
        assertEquals(false, updated.isActive());
        assertEquals(6, updated.getSortOrder());
        assertEquals("Getränke & Säfte", cola.getCategory());
        verify(foodRepository).saveAll(List.of(cola));
        verify(translator, never()).translate(anyString(), anyString());
    }

    @Test
    void reorderSetsSortOrder() {
        CategoryEntity a = category("a", "Pizza", "Pizza", "بيتزا", 0, true);
        CategoryEntity b = category("b", "Pasta", "Pasta", "معكرونة", 1, true);
        CategoryEntity c = category("c", "Burger", "Burger", "برغر", 2, false);
        when(categoryRepository.findAllByOrderBySortOrderAsc()).thenReturn(List.of(a, b, c));

        service.reorder(List.of("c", "a", "b"));

        assertEquals(1, a.getSortOrder());
        assertEquals(2, b.getSortOrder());
        assertEquals(0, c.getSortOrder());
        verify(categoryRepository).saveAll(List.of(a, b, c));
    }

    @Test
    void reorderNeedsEveryCategoryExactlyOnce() {
        when(categoryRepository.findAllByOrderBySortOrderAsc())
                .thenReturn(List.of(category("a", "Pizza", null, null, 0, true), category("b", "Pasta", null, null, 1, true)));

        for (List<String> wrong : List.of(List.of("a"), List.of("a", "a"), List.of("a", "x"))) {
            CategoryException ex = assertThrows(CategoryException.class, () -> service.reorder(wrong));
            assertEquals("order", ex.getDetails().get("field"));
        }
        verify(categoryRepository, never()).saveAll(any());
    }

    @Test
    void deleteIsBlockedWhenFoodsUseTheCategory() {
        when(categoryRepository.findById("c1")).thenReturn(Optional.of(category("c1", "Pizza", null, null, 0, true)));
        when(foodRepository.countByCategoryId("c1")).thenReturn(3L);

        CategoryException ex = assertThrows(CategoryException.class, () -> service.deleteCategory("c1"));

        assertEquals("CATEGORY_NOT_EMPTY", ex.getCode());
        assertEquals(3L, ex.getDetails().get("foodCount"));
        verify(categoryRepository, never()).deleteById(any());
    }

    @Test
    void emptyCategoryCanBeDeleted() {
        when(categoryRepository.findById("c1")).thenReturn(Optional.of(category("c1", "Pizza", null, null, 0, true)));
        when(foodRepository.countByCategoryId("c1")).thenReturn(0L);

        service.deleteCategory("c1");

        verify(categoryRepository).deleteById("c1");
        when(categoryRepository.findById("x")).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class, () -> service.deleteCategory("x"));
    }

    @Test
    void publicListUsesLanguageFallback() {
        when(categoryRepository.findByActiveTrueOrderBySortOrderAsc())
                .thenReturn(List.of(category("c1", "Pizza", "Pizza", "بيتزا", 0, true),
                        category("c2", "Suppen", null, null, 1, true),
                        category("c3", "Nudeln", "Noodles", null, 2, true)));

        List<CategoryResponse> arabic = service.readActiveCategories("ar");

        assertEquals(Map.of("ar", "بيتزا"), arabic.get(0).getName());
        assertEquals(Map.of("ar", "Suppen"), arabic.get(1).getName());  // nur Deutsch vorhanden
        assertEquals(Map.of("ar", "Noodles"), arabic.get(2).getName()); // Englisch vor Deutsch
        assertEquals(3, service.readActiveCategories("all").get(0).getName().size());
    }

    @Test
    void foodCategoryIsResolvedByIdGermanNameOrSlug() {
        CategoryEntity drinks = category("c7", "Getränke", "Drinks", "مشروبات", 6, true);
        when(categoryRepository.findById("c7")).thenReturn(Optional.of(drinks));
        when(categoryRepository.findAllByOrderBySortOrderAsc()).thenReturn(List.of(drinks));

        assertEquals("c7", service.resolveForFood("c7", null).getId());
        assertEquals("c7", service.resolveForFood(null, "Getränke").getId());
        assertEquals("c7", service.resolveForFood(null, "getränke ").getId());
        assertEquals("c7", service.resolveForFood(null, "getraenke").getId());

        when(categoryRepository.findById("x")).thenReturn(Optional.empty());
        assertEquals("categoryId", assertThrows(CategoryException.class,
                () -> service.resolveForFood("x", "Getränke")).getDetails().get("field"));
        assertEquals("category", assertThrows(CategoryException.class,
                () -> service.resolveForFood(null, "Suppe")).getDetails().get("field"));
        assertEquals("categoryId", assertThrows(CategoryException.class,
                () -> service.resolveForFood(null, " ")).getDetails().get("field"));
    }

    private void assertInvalid(String field, CategoryRequest request) {
        CategoryException ex = assertThrows(CategoryException.class, () -> service.addCategory(request));
        assertEquals("CATEGORY_INVALID", ex.getCode());
        assertEquals(field, ex.getDetails().get("field"));
    }

    @Test
    void invalidCategoriesAreRejected() {
        assertInvalid("name.de", request(" ", "Pizza", null));
        assertInvalid("name.de", CategoryRequest.builder().name(null).build());
        assertInvalid("name.en", request("Pizza", "x".repeat(101), null));
        Map<String, String> french = new HashMap<>(Map.of("de", "Pizza", "fr", "Pizza"));
        assertInvalid("name", CategoryRequest.builder().name(french).build());
        CategoryRequest script = request("Pizza", null, null);
        script.setImageUrl("javascript:alert(1)");
        assertInvalid("imageUrl", script);
        CategoryRequest longUrl = request("Pizza", null, null);
        longUrl.setImageUrl("https://" + "x".repeat(500));
        assertInvalid("imageUrl", longUrl);
        verify(categoryRepository, never()).save(any());
    }

    @Test
    void reorderReturnsNewOrder() {
        List<CategoryEntity> stored = new ArrayList<>(List.of(category("a", "Pizza", null, null, 0, true)));
        when(categoryRepository.findAllByOrderBySortOrderAsc()).thenReturn(stored);
        ArgumentCaptor<List<CategoryEntity>> saved = ArgumentCaptor.forClass(List.class);

        assertEquals("a", service.reorder(List.of("a")).get(0).getId());
        verify(categoryRepository).saveAll(saved.capture());
        assertEquals(0, saved.getValue().get(0).getSortOrder());
    }
}
