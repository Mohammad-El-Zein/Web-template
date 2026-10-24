package in.MoProjekt.foodweb.storage;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
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

import in.MoProjekt.foodweb.entity.FoodImageEntity;
import in.MoProjekt.foodweb.exception.ImageException;
import in.MoProjekt.foodweb.repository.FoodImageRepository;

@ExtendWith(MockitoExtension.class)
class MongoImageStorageTest {

    private static final byte[] GIF = { 'G', 'I', 'F', '8', '9', 'a', 1, 0 };
    private static final byte[] WEBP = { 'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P', 'V', 'P' };

    @Mock private FoodImageRepository repository;
    private MongoImageStorage storage;

    @BeforeEach
    void setUp() {
        storage = new MongoImageStorage(repository, "https://api.example.com");
    }

    @Test
    void uploadStoresImageWithDetectedType() {
        when(repository.save(any())).thenAnswer(inv -> {
            FoodImageEntity image = inv.getArgument(0);
            image.setId("img1");
            return image;
        });

        String url = storage.upload(new MockMultipartFile("file", "a.webp", null, WEBP), "site");

        assertEquals("https://api.example.com/api/foods/images/img1", url);
        ArgumentCaptor<FoodImageEntity> saved = ArgumentCaptor.forClass(FoodImageEntity.class);
        verify(repository).save(saved.capture());
        assertEquals("image/webp", saved.getValue().getContentType());
    }

    @Test
    void deleteOnlyMongoUrls() {
        storage.delete("https://old-backend.example.com/api/foods/images/img1?v=2");
        verify(repository).deleteById("img1");

        storage.delete("https://img.example.com/flavorhaus/foods/a.jpg");
        storage.delete(null);
        verify(repository, never()).deleteById("a.jpg");
    }

    @Test
    void deleteErrorsAreOnlyLogged() {
        doThrow(new RuntimeException("Mongo down")).when(repository).deleteById("img1");
        storage.delete("https://api.example.com/api/foods/images/img1");
    }

    @Test
    void onlyRealImagesAreAccepted() {
        assertEquals("image/gif", ImageFiles.check(new MockMultipartFile("file", "a.gif", "image/gif", GIF)).contentType());

        String svg = "<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>";
        for (MockMultipartFile file : new MockMultipartFile[] {
                new MockMultipartFile("file", "a.svg", "image/svg+xml", svg.getBytes()),
                new MockMultipartFile("file", "a.pdf", "application/pdf", "%PDF-1.4".getBytes()),
                new MockMultipartFile("file", "a.jpg", "image/jpeg", new byte[] { (byte) 0xFF, (byte) 0xD8 }),
                new MockMultipartFile("file", "a.jpg", "image/jpeg", new byte[0]) }) {
            ImageException ex = assertThrows(ImageException.class, () -> storage.upload(file, "foods"));
            assertEquals("IMAGE_INVALID", ex.getCode());
            assertEquals("file", ex.getDetails().get("field"));
        }
        verify(repository, never()).save(any());
    }

    @Test
    void tooLargeImagesAreRejected() {
        byte[] big = new byte[(int) ImageFiles.MAX_BYTES + 1];
        System.arraycopy(GIF, 0, big, 0, GIF.length);

        ImageException ex = assertThrows(ImageException.class,
                () -> storage.upload(new MockMultipartFile("file", "big.gif", "image/gif", big), "foods"));

        assertEquals("IMAGE_TOO_LARGE", ex.getCode());
        assertEquals(ImageFiles.MAX_BYTES, ex.getDetails().get("maxBytes"));
    }
}
