package in.MoProjekt.foodweb.storage;

import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

// Cloudflare R2: ein Bucket für alle Restaurants, ein Ordner pro Restaurant.
// Schlüssel: <restaurantSlug>/<folder>/<uuid>.<ext>, URL: <publicUrl>/<schlüssel>
public class R2ImageStorage implements ImageStorage {

    private final S3Client s3Client;
    private final String bucket;
    private final String publicUrl;
    private final String restaurantSlug;
    private final MongoImageStorage fallback;

    public R2ImageStorage(S3Client s3Client, String bucket, String publicUrl, String restaurantSlug,
                          MongoImageStorage fallback) {
        this.s3Client = s3Client;
        this.bucket = bucket;
        this.publicUrl = publicUrl.replaceAll("/+$", "");
        this.restaurantSlug = restaurantSlug;
        this.fallback = fallback;
    }

    @Override
    public String upload(MultipartFile file, String folder) {
        String checkedFolder = ImageFiles.checkFolder(folder);
        ImageFiles.CheckedImage image = ImageFiles.check(file);
        String key = restaurantSlug + "/" + checkedFolder + "/" + UUID.randomUUID() + "." + image.extension();
        try {
            // Keine ACL: R2 kennt keine ACLs, der Bucket ist öffentlich bzw. hat eine eigene Domain
            s3Client.putObject(PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(image.contentType())
                    .cacheControl("public, max-age=31536000, immutable")
                    .build(), RequestBody.fromBytes(image.data()));
            return publicUrl + "/" + key;
        } catch (Exception ex) {
            // R2 gerade nicht erreichbar -> Bild in MongoDB speichern, damit der Admin weiterarbeiten kann
            System.out.println("WARNING: R2 upload failed, storing image in MongoDB instead: " + ex.getMessage());
            return fallback.store(image);
        }
    }

    @Override
    public void delete(String url) {
        if (url == null || url.isBlank()) {
            return;
        }
        if (url.startsWith(publicUrl + "/")) {
            String key = url.substring(publicUrl.length() + 1).split("[?#]")[0];
            // Nur Bilder des eigenen Restaurants löschen (gemeinsamer Bucket)
            if (!key.startsWith(restaurantSlug + "/") || key.contains("..")) {
                System.out.println("Image belongs to another restaurant, not deleted: " + url);
                return;
            }
            try {
                s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
            } catch (Exception ex) {
                System.out.println("Could not delete image " + key + " from R2: " + ex.getMessage());
            }
        } else if (fallback.owns(url)) {
            // Ältere Bilder aus MongoDB
            fallback.delete(url);
        } else {
            // z. B. alte AWS-S3-Links oder externe Bilder
            System.out.println("Unknown image URL, not deleted: " + url);
        }
    }
}
