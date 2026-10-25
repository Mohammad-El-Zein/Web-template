package in.MoProjekt.foodweb.storage;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import in.MoProjekt.foodweb.exception.ImageException;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@ExtendWith(MockitoExtension.class)
class R2ImageStorageTest {

    private static final byte[] PNG = { (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0 };

    @Mock private S3Client s3Client;
    @Mock private MongoImageStorage mongo;

    private R2ImageStorage storage;

    @BeforeEach
    void setUp() {
        // Abschließender Schrägstrich in R2_PUBLIC_URL wird entfernt
        storage = new R2ImageStorage(s3Client, "restaurants", "https://img.example.com/", "pizzeria-roma", mongo);
    }

    @Test
    void uploadBuildsKeyAndPublicUrl() {
        // Dateiname und Browser-Header passen nicht zum Inhalt -> erkannter Typ zählt
        MockMultipartFile file = new MockMultipartFile("file", "logo.exe", "image/jpeg", PNG);

        String url = storage.upload(file, "categories");

        ArgumentCaptor<PutObjectRequest> request = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3Client).putObject(request.capture(), any(RequestBody.class));
        String key = request.getValue().key();
        assertTrue(key.matches("pizzeria-roma/categories/[0-9a-f-]{36}\\.png"), key);
        assertEquals("restaurants", request.getValue().bucket());
        assertEquals("image/png", request.getValue().contentType());
        assertNull(request.getValue().acl());
        assertEquals("https://img.example.com/" + key, url);
    }

    @Test
    void defaultFolderIsSiteAndUnknownFolderIsRejected() {
        storage.upload(new MockMultipartFile("file", "a.png", "image/png", PNG), null);
        ArgumentCaptor<PutObjectRequest> request = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3Client).putObject(request.capture(), any(RequestBody.class));
        assertTrue(request.getValue().key().startsWith("pizzeria-roma/site/"));

        ImageException ex = assertThrows(ImageException.class,
                () -> storage.upload(new MockMultipartFile("file", "a.png", "image/png", PNG), "../andere"));
        assertEquals("folder", ex.getDetails().get("field"));
    }

    @Test
    void reviewPhotosGoToReviewsFolder() {
        storage.upload(new MockMultipartFile("file", "a.png", "image/png", PNG), "reviews");
        ArgumentCaptor<PutObjectRequest> request = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3Client).putObject(request.capture(), any(RequestBody.class));
        assertTrue(request.getValue().key().startsWith("pizzeria-roma/reviews/"));
    }

    @Test
    void failingR2FallsBackToMongo() {
        when(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenThrow(SdkClientException.create("timeout"));
        when(mongo.store(any())).thenReturn("https://api.example.com/api/foods/images/m1");

        String url = storage.upload(new MockMultipartFile("file", "a.png", "image/png", PNG), "foods");

        assertEquals("https://api.example.com/api/foods/images/m1", url);
    }

    @Test
    void deleteR2ImageOfOwnRestaurant() {
        storage.delete("https://img.example.com/pizzeria-roma/foods/abc.jpg");

        ArgumentCaptor<DeleteObjectRequest> request = ArgumentCaptor.forClass(DeleteObjectRequest.class);
        verify(s3Client).deleteObject(request.capture());
        assertEquals("pizzeria-roma/foods/abc.jpg", request.getValue().key());
        assertEquals("restaurants", request.getValue().bucket());
    }

    @Test
    void imagesOfOtherRestaurantsAreNeverDeleted() {
        storage.delete("https://img.example.com/burger-king/foods/abc.jpg");
        storage.delete("https://img.example.com/pizzeria-roma/../burger-king/foods/abc.jpg");
        storage.delete("https://img.example.com/pizzeria-roma-2/foods/abc.jpg");
        verify(s3Client, never()).deleteObject(any(DeleteObjectRequest.class));
    }

    @Test
    void deleteMongoAndOldS3Urls() {
        when(mongo.owns(any())).thenAnswer(inv -> inv.<String>getArgument(0).contains("/api/foods/images/"));

        storage.delete("https://api.example.com/api/foods/images/m1");
        storage.delete("https://old-bucket.s3.amazonaws.com/abc.jpg");
        storage.delete(null);
        storage.delete("");

        verify(mongo).delete("https://api.example.com/api/foods/images/m1");
        verify(mongo, never()).delete("https://old-bucket.s3.amazonaws.com/abc.jpg");
        verify(s3Client, never()).deleteObject(any(DeleteObjectRequest.class));
    }

    @Test
    void deleteErrorsAreOnlyLogged() {
        when(s3Client.deleteObject(any(DeleteObjectRequest.class))).thenThrow(SdkClientException.create("R2 down"));
        storage.delete("https://img.example.com/pizzeria-roma/foods/abc.jpg");
    }
}
