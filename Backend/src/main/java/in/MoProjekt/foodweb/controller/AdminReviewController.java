package in.MoProjekt.foodweb.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import in.MoProjekt.foodweb.io.ReviewRequest;
import in.MoProjekt.foodweb.io.ReviewResponse;
import in.MoProjekt.foodweb.service.ReviewService;
import lombok.AllArgsConstructor;

// Nur für Admins (siehe SecurityConfig: /api/admin/**)
@RestController
@RequestMapping("/api/admin/reviews")
@AllArgsConstructor
public class AdminReviewController {

    private final ReviewService reviewService;

    // Alle Bewertungen inkl. ausgeblendeter, alle Sprachen
    @GetMapping
    public List<ReviewResponse> readAll() {
        return reviewService.readAllReviews();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse add(@RequestBody ReviewRequest request) {
        return reviewService.addReview(request);
    }

    // Body: Liste der ids in der neuen Reihenfolge
    @PutMapping("/order")
    public List<ReviewResponse> reorder(@RequestBody List<String> ids) {
        return reviewService.reorder(ids);
    }

    @PutMapping("/{id}")
    public ReviewResponse update(@PathVariable String id, @RequestBody ReviewRequest request) {
        return reviewService.updateReview(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        reviewService.deleteReview(id);
    }
}
