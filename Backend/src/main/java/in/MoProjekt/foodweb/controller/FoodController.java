package in.MoProjekt.foodweb.controller;

import java.util.List;
import java.util.concurrent.TimeUnit;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseStatus;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import in.MoProjekt.foodweb.entity.FoodImageEntity;
import in.MoProjekt.foodweb.io.FoodRequest;
import in.MoProjekt.foodweb.io.FoodResponse;
import in.MoProjekt.foodweb.service.FoodService;
import lombok.AllArgsConstructor;

@RestController
@RequestMapping("/api/foods")
@AllArgsConstructor
@CrossOrigin("*")
public class FoodController {

    private final FoodService foodService;
    @PostMapping
    public FoodResponse addFood(@RequestPart("food") String foodString,
                                @RequestPart("file")MultipartFile file){
        return foodService.addFood(parseFood(foodString), file);
    }

    // Bild ist beim Bearbeiten optional
    @PutMapping("/{id}")
    public FoodResponse updateFood(@PathVariable String id,
                                   @RequestPart("food") String foodString,
                                   @RequestPart(value = "file", required = false) MultipartFile file) {
        return foodService.updateFood(id, parseFood(foodString), file);
    }

    private FoodRequest parseFood(String foodString) {
        try {
            return new ObjectMapper().readValue(foodString, FoodRequest.class);
        } catch (JsonProcessingException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid JSON format");
        }
    }

    @GetMapping
public List<FoodResponse> readFoods(
        @RequestParam(defaultValue = "de") String lang) {
    return foodService.readFoods(lang);
}


    // Bilder, die in MongoDB gespeichert sind (öffentlich lesbar)
    @GetMapping("/images/{id}")
    public ResponseEntity<byte[]> readImage(@PathVariable String id) {
        FoodImageEntity image = foodService.readImage(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.getContentType()))
                .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic())
                .body(image.getData());
    }

   @GetMapping("/{id}")
public FoodResponse readFood(
        @PathVariable String id,
        @RequestParam(defaultValue = "de") String lang) {
    return foodService.readFood(id, lang);
}


    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteFood(@PathVariable String id) {
        foodService.deleteFood(id);
    }
}