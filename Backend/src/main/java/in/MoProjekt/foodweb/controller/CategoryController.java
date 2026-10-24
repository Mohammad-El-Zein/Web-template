package in.MoProjekt.foodweb.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import in.MoProjekt.foodweb.io.CategoryResponse;
import in.MoProjekt.foodweb.service.CategoryService;
import lombok.AllArgsConstructor;

// Öffentlich lesbar (siehe SecurityConfig: GET /api/categories)
@RestController
@RequestMapping("/api/categories")
@AllArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    // Nur aktive Kategorien, sortiert; lang=de|en|ar|all
    @GetMapping
    public List<CategoryResponse> readCategories(@RequestParam(defaultValue = "de") String lang) {
        return categoryService.readActiveCategories(lang);
    }
}
