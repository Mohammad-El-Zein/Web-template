package in.MoProjekt.foodweb.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import in.MoProjekt.foodweb.entity.FoodEntity;
import in.MoProjekt.foodweb.entity.FoodImageEntity;
import in.MoProjekt.foodweb.io.FoodRequest;
import in.MoProjekt.foodweb.io.FoodResponse;
import in.MoProjekt.foodweb.repository.FoodImageRepository;
import in.MoProjekt.foodweb.repository.FoodRepository;
import software.amazon.awssdk.core.sync.RequestBody;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;
import software.amazon.awssdk.services.s3.model.S3Exception;

@Service
public class FoodServiceImpl implements FoodService {

    @Autowired
    private S3Client s3Client;

    @Autowired
    private FoodRepository foodRepository;

    @Autowired
    private OpenAITranslationService translator;

    @Autowired
    private FoodImageRepository foodImageRepository;

    @Value("${backend.url}")
    private String backendUrl;

    private static final String DB_IMAGE_PATH = "/api/foods/images/";
    private static final String ALL_LANGUAGES = "all";
    private static final long MAX_DB_IMAGE_SIZE = 5 * 1024 * 1024;

    @Value("${aws.s3.bucketName}")
    private String bucketName;

    @Override
    public String uploadFile(MultipartFile file) {
        // Implementation for file upload
        String filenameExtension = file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf(".")+1);
        String key = UUID.randomUUID().toString() + "." + filenameExtension;
        try{
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
            .bucket(bucketName)
            .key(key)
            .acl("public-read")
            .contentType(file.getContentType())
            .build();
            PutObjectResponse response;
            try {
                response = s3Client.putObject(putObjectRequest, RequestBody.fromBytes(file.getBytes()));
            } catch (S3Exception ex) {
                // Neuere Buckets erlauben keine ACLs mehr -> ohne ACL erneut versuchen
                if (!"AccessControlListNotSupported".equals(ex.awsErrorDetails().errorCode())) {
                    throw ex;
                }
                response = s3Client.putObject(putObjectRequest.toBuilder().acl((String) null).build(),
                        RequestBody.fromBytes(file.getBytes()));
            }

            if(response.sdkHttpResponse().isSuccessful()){
                return "https://" + bucketName + ".s3.amazonaws.com/" + key;
        }else{
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Failed to upload the file");
            }
        
        }catch(IOException ex){
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"An error occurred while uploading the file");
            
        }
    }

    private FoodResponse convertToResponse(FoodEntity entity){
    return FoodResponse.builder()
            .id(entity.getId())
            .name(entity.getName())               // komplette Map
            .description(entity.getDescription()) // komplette Map
            .price(entity.getPrice())
            .category(entity.getCategory())
            .imageUrl(entity.getImageUrl())
            .build();
}


    @Override
public List<FoodResponse> readFoods(String lang) {
    // lang=all liefert alle Sprachen (für das Admin-Panel)
    return foodRepository.findAll().stream()
            .map(food -> ALL_LANGUAGES.equals(lang) ? convertToResponse(food) : convertToResponse(food, lang))
            .collect(Collectors.toList());
}


   @Override
public FoodResponse readFood(String id, String lang) {
    FoodEntity entity = foodRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Food not found"));
    return ALL_LANGUAGES.equals(lang) ? convertToResponse(entity) : convertToResponse(entity, lang);
}


    @Override
    public boolean deleteFile(String filename) {
        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
            .bucket(bucketName)
            .key(filename)
            .build();
            s3Client.deleteObject(deleteObjectRequest);
            return true;
    }

    @Override
public void deleteFood(String id) {

    // hole deutsche Version, reicht für delete
    FoodResponse response = readFood(id, "de");

    deleteImage(response.getImageUrl());
    foodRepository.deleteById(id);
}

    private void deleteImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }
        String filename = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
        try {
            if (imageUrl.contains(DB_IMAGE_PATH)) {
                foodImageRepository.deleteById(filename);
            } else {
                deleteFile(filename);
            }
        } catch (Exception ex) {
            // Bild konnte nicht gelöscht werden (z. B. S3 nicht erreichbar) -> Gericht trotzdem löschen
            System.out.println("Could not delete image " + filename + ": " + ex.getMessage());
        }
    }


   
    // Gewünschte Sprache, sonst Englisch, sonst Deutsch
    private String textFor(Map<String, String> texts, String lang) {
        for (String candidate : List.of(lang, "en", "de")) {
            String text = texts.get(candidate);
            if (text != null && !text.isBlank()) {
                return text;
            }
        }
        return "";
    }

    @SuppressWarnings("unchecked")
private Map<String, String> cast(Object obj) {
    if (obj instanceof Map<?, ?> map) {
        return (Map<String, String>) map;
    }
    return Map.of();
}

private FoodResponse convertToResponse(FoodEntity entity, String lang) {

    Map<String, String> nameMap = cast(entity.getName());
    Map<String, String> descMap = cast(entity.getDescription());

    String name = textFor(nameMap, lang);
    String desc = textFor(descMap, lang);

    return FoodResponse.builder()
        .id(entity.getId())
        .name(Map.of(lang, name))
        .description(Map.of(lang, desc))
        .price(entity.getPrice())
        .category(entity.getCategory())
        .imageUrl(entity.getImageUrl())
        .build();
}



    @Override
public FoodResponse addFood(FoodRequest request, MultipartFile file) {
    if (file == null || file.isEmpty() || file.getContentType() == null || !file.getContentType().startsWith("image/")) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please upload an image");
    }
    String imageUrl = storeImage(file);

    validate(request);

    FoodEntity entity = new FoodEntity();
    entity.setName(completeTranslations(request.getName()));
    entity.setDescription(completeTranslations(request.getDescription()));
    entity.setCategory(request.getCategory());
    entity.setPrice(request.getPrice());
    entity.setImageUrl(imageUrl);

    FoodEntity saved = foodRepository.save(entity);

    return convertToResponse(saved, "de");
}

    // Erst S3 versuchen; klappt das nicht (z. B. AWS-Zugang abgelaufen), Bild in MongoDB speichern
    private String storeImage(MultipartFile file) {
        try {
            return uploadFile(file);
        } catch (Exception ex) {
            System.out.println("S3 upload failed, storing image in MongoDB instead: " + ex.getMessage());
        }
        if (file.getSize() > MAX_DB_IMAGE_SIZE) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Image must be smaller than 5 MB");
        }
        try {
            FoodImageEntity image = foodImageRepository.save(FoodImageEntity.builder()
                    .contentType(file.getContentType())
                    .data(file.getBytes())
                    .build());
            return backendUrl + DB_IMAGE_PATH + image.getId();
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not read the image");
        }
    }

    @Override
    public FoodImageEntity readImage(String id) {
        return foodImageRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found"));
    }

    @Override
    public FoodResponse updateFood(String id, FoodRequest request, MultipartFile file) {
        validate(request);
        FoodEntity entity = foodRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Food not found"));

        if (file != null && !file.isEmpty()) {
            if (file.getContentType() == null || !file.getContentType().startsWith("image/")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please upload an image");
            }
            String oldImageUrl = entity.getImageUrl();
            entity.setImageUrl(storeImage(file));
            deleteImage(oldImageUrl);
        }
        entity.setName(completeTranslations(request.getName()));
        entity.setDescription(completeTranslations(request.getDescription()));
        entity.setCategory(request.getCategory());
        entity.setPrice(request.getPrice());

        return convertToResponse(foodRepository.save(entity));
    }

    @Override
    public Map<String, String> translate(String germanText) {
        return completeTranslations(Map.of("de", germanText));
    }

    private void validate(FoodRequest request) {
        String germanName = request.getName().get("de");
        if (germanName == null || germanName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "German name is required");
        }
        if (request.getPrice() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Price must not be negative");
        }
    }

    // Leere Sprachen per KI aus dem Deutschen übersetzen (falls OpenAI nicht erreichbar: leer lassen)
    private Map<String, String> completeTranslations(Map<String, String> texts) {
        Map<String, String> result = new HashMap<>();
        texts.forEach((lang, text) -> {
            if (OpenAITranslationService.LANGUAGES.containsKey(lang) && text != null && !text.isBlank()) {
                result.put(lang, text.trim());
            }
        });
        String de = result.getOrDefault("de", "");
        if (de.isEmpty()) {
            return result;
        }
        for (Map.Entry<String, String> language : OpenAITranslationService.LANGUAGES.entrySet()) {
            if (result.containsKey(language.getKey())) {
                continue;
            }
            try {
                // höchstens 20 Sekunden auf OpenAI warten, sonst ohne Übersetzung speichern
                String translated = CompletableFuture.supplyAsync(() -> translator.translate(de, language.getValue()))
                        .get(20, TimeUnit.SECONDS);
                if (translated != null && !translated.isBlank()) {
                    result.put(language.getKey(), translated.trim());
                }
            } catch (Exception ex) {
                System.out.println("Translation to " + language.getValue() + " failed: " + ex.getMessage());
            }
        }
        return result;
    }


}