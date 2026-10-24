package in.MoProjekt.foodweb.storage;

import java.net.URI;
import java.time.Duration;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.checksums.RequestChecksumCalculation;
import software.amazon.awssdk.core.checksums.ResponseChecksumValidation;
import software.amazon.awssdk.core.client.config.ClientOverrideConfiguration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

// Wählt den Bildspeicher: R2, wenn alle R2-Variablen gesetzt sind, sonst MongoDB
@Configuration
public class ImageStorageConfig {

    private static final String DEFAULT_SLUG = "flavorhaus";

    @Bean
    @Primary
    public ImageStorage imageStorage(@Value("${r2.account-id:}") String accountId,
                                     @Value("${r2.access-key-id:}") String accessKeyId,
                                     @Value("${r2.secret-access-key:}") String secretAccessKey,
                                     @Value("${r2.bucket:}") String bucket,
                                     @Value("${r2.public-url:}") String publicUrl,
                                     @Value("${restaurant.slug:}") String restaurantSlug,
                                     MongoImageStorage mongoImageStorage) {
        ImageStorage storage = choose(accountId, accessKeyId, secretAccessKey, bucket, publicUrl,
                restaurantSlug, mongoImageStorage);
        if (storage instanceof R2ImageStorage) {
            System.out.println("Image storage: Cloudflare R2 (bucket " + bucket.trim() + ", folder "
                    + restaurantSlug(restaurantSlug) + "/)");
        } else {
            System.out.println("Image storage: MongoDB (R2 not configured)");
        }
        return storage;
    }

    static ImageStorage choose(String accountId, String accessKeyId, String secretAccessKey, String bucket,
                               String publicUrl, String restaurantSlug, MongoImageStorage mongoImageStorage) {
        boolean r2Configured = Stream.of(accountId, accessKeyId, secretAccessKey, bucket, publicUrl)
                .allMatch(value -> value != null && !value.isBlank());
        if (!r2Configured) {
            return mongoImageStorage;
        }
        S3Client client = r2Client(accountId.trim(), accessKeyId.trim(), secretAccessKey.trim());
        return new R2ImageStorage(client, bucket.trim(), publicUrl.trim(), restaurantSlug(restaurantSlug), mongoImageStorage);
    }

    // Nur a-z, 0-9 und "-", leer = "flavorhaus"
    static String restaurantSlug(String slug) {
        if (slug == null || slug.isBlank()) {
            return DEFAULT_SLUG;
        }
        String trimmed = slug.trim();
        if (!trimmed.matches("^[a-z0-9-]+$")) {
            throw new IllegalStateException("RESTAURANT_SLUG may only contain a-z, 0-9 and '-': " + slug);
        }
        return trimmed;
    }

    private static S3Client r2Client(String accountId, String accessKeyId, String secretAccessKey) {
        return S3Client.builder()
                .endpointOverride(URI.create("https://" + accountId + ".r2.cloudflarestorage.com"))
                .region(Region.of("auto"))
                .forcePathStyle(true)
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKeyId, secretAccessKey)))
                // Neuere SDK-Versionen schicken sonst Prüfsummen, die R2 ablehnen kann
                .requestChecksumCalculation(RequestChecksumCalculation.WHEN_REQUIRED)
                .responseChecksumValidation(ResponseChecksumValidation.WHEN_REQUIRED)
                // nicht ewig warten, falls R2 nicht erreichbar ist
                .overrideConfiguration(ClientOverrideConfiguration.builder()
                        .apiCallTimeout(Duration.ofSeconds(15))
                        .apiCallAttemptTimeout(Duration.ofSeconds(15))
                        .build())
                .build();
    }
}
