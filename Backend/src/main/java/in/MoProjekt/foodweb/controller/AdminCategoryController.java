package in.MoProjekt.foodweb.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import in.MoProjekt.foodweb.io.CategoryRequest;
import in.MoProjekt.foodweb.io.CategoryResponse;
import in.MoProjekt.foodweb.service.CategoryService;
import lombok.AllArgsConstructor;

// Nur für Admins (siehe SecurityConfig: /api/admin/**)
@RestController
@RequestMapping("/api/admin/categories")
@AllArgsConstructor
public class AdminCategoryController {

    private final CategoryService categoryService;

    // Alle Kategorien inkl. inaktiver, alle Sprachen
    @GetMapping
    public List<CategoryResponse> readAll() {
        return categoryService.readAllCategories();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse add(@RequestBody CategoryRequest request) {
        return categoryService.addCategory(request);
    }

    // Body: Liste der ids in der neuen Reihenfolge
    @PutMapping("/order")
    public List<CategoryResponse> reorder(@RequestBody List<String> ids) {
        return categoryService.reorder(ids);
    }

    @PutMapping("/{id}")
    public CategoryResponse update(@PathVariable String id, @RequestBody CategoryRequest request) {
        return categoryService.updateCategory(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        categoryService.deleteCategory(id);
    }
}
