package in.MoProjekt.foodweb.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import in.MoProjekt.foodweb.io.ReviewResponse;
import in.MoProjekt.foodweb.service.ReviewService;
import lombok.AllArgsConstructor;

// Öffentlich lesbar (siehe SecurityConfig: GET /api/reviews)
@RestController
@RequestMapping("/api/reviews")
@AllArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    // Nur sichtbare Bewertungen, sortiert; lang=de|en|ar|all
    @GetMapping
    public List<ReviewResponse> readReviews(@RequestParam(defaultValue = "de") String lang) {
        return reviewService.readVisibleReviews(lang);
    }
}
