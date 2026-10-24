package in.MoProjekt.foodweb.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import in.MoProjekt.foodweb.entity.FoodImageEntity;
import in.MoProjekt.foodweb.repository.FoodImageRepository;

// Bilder direkt in MongoDB (food_images), ausgeliefert über GET /api/foods/images/{id}.
// Wird genutzt, wenn R2 nicht eingerichtet ist oder gerade nicht erreichbar ist.
@Component
public class MongoImageStorage implements ImageStorage {

    public static final String IMAGE_PATH = "/api/foods/images/";

    private final FoodImageRepository foodImageRepository;
    private final String backendUrl;

    public MongoImageStorage(FoodImageRepository foodImageRepository, @Value("${backend.url}") String backendUrl) {
        this.foodImageRepository = foodImageRepository;
        this.backendUrl = backendUrl;
    }

    @Override
    public String upload(MultipartFile file, String folder) {
        ImageFiles.checkFolder(folder);
        return store(ImageFiles.check(file));
    }

    // Bereits geprüftes Bild speichern (auch Ersatz, wenn R2 ausfällt)
    String store(ImageFiles.CheckedImage image) {
        FoodImageEntity saved = foodImageRepository.save(FoodImageEntity.builder()
                .contentType(image.contentType())
                .data(image.data())
                .build());
        return backendUrl + IMAGE_PATH + saved.getId();
    }

    public boolean owns(String url) {
        return url != null && url.contains(IMAGE_PATH);
    }

    @Override
    public void delete(String url) {
        if (url == null || url.isBlank()) {
            return;
        }
        if (!owns(url)) {
            System.out.println("Image not stored in MongoDB, not deleted: " + url);
            return;
        }
        String id = url.substring(url.indexOf(IMAGE_PATH) + IMAGE_PATH.length()).split("[?#]")[0];
        try {
            foodImageRepository.deleteById(id);
        } catch (Exception ex) {
            System.out.println("Could not delete image " + id + " from MongoDB: " + ex.getMessage());
        }
    }

    public FoodImageEntity read(String id) {
        return foodImageRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found"));
    }
}
