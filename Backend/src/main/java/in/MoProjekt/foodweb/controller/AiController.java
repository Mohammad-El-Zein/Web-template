package in.MoProjekt.foodweb.controller;

import in.MoProjekt.foodweb.io.NutritionRequest;
import in.MoProjekt.foodweb.io.NutritionResponse;
import in.MoProjekt.foodweb.service.NutritionService;
import in.MoProjekt.foodweb.service.RateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/nutrition")
public class AiController {

    private static final int MAX_FOOD_NAME_LENGTH = 100;
    private static final int MAX_PORTION_GRAMS = 2000;

    private final NutritionService nutritionService;
    private final RateLimiter rateLimiter;

    public AiController(NutritionService nutritionService, RateLimiter rateLimiter) {
        this.nutritionService = nutritionService;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping("/analyze")
    public NutritionResponse analyze(@RequestBody NutritionRequest request, HttpServletRequest httpRequest) throws Exception {
        String foodName = request.getFoodName();
        if (foodName == null || foodName.isBlank() || foodName.length() > MAX_FOOD_NAME_LENGTH
                || request.getPortion() < 1 || request.getPortion() > MAX_PORTION_GRAMS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid nutrition request");
        }
        if (!rateLimiter.tryAcquire(clientIp(httpRequest))) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many requests");
        }
        return nutritionService.analyze(request);
    }

    // Railway steht als Proxy davor, daher die echte IP aus dem Header lesen
    private String clientIp(HttpServletRequest request) {
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String[] parts = forwarded.split(",");
            return parts[parts.length - 1].trim();
        }
        return request.getRemoteAddr();
    }
}
