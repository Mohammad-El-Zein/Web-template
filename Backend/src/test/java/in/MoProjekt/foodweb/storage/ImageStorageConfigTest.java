package in.MoProjekt.foodweb.storage;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ImageStorageConfigTest {

    @Mock private MongoImageStorage mongo;

    private ImageStorage choose(String accountId, String keyId, String secret, String bucket, String publicUrl) {
        return ImageStorageConfig.choose(accountId, keyId, secret, bucket, publicUrl, "", mongo);
    }

    @Test
    void r2IsUsedWhenAllVariablesAreSet() {
        ImageStorage storage = choose("acc123", "key", "secret", "restaurants", "https://img.example.com");
        assertInstanceOf(R2ImageStorage.class, storage);
    }

    @Test
    void mongoIsUsedWhenAnyR2VariableIsMissing() {
        assertSame(mongo, choose("", "", "", "", ""));
        assertSame(mongo, choose(null, "key", "secret", "restaurants", "https://img.example.com"));
        assertSame(mongo, choose("acc123", "key", " ", "restaurants", "https://img.example.com"));
        assertSame(mongo, choose("acc123", "key", "secret", "restaurants", ""));
    }

    @Test
    void restaurantSlugDefaultsAndIsValidated() {
        assertEquals("flavorhaus", ImageStorageConfig.restaurantSlug(null));
        assertEquals("flavorhaus", ImageStorageConfig.restaurantSlug(" "));
        assertEquals("pizzeria-roma", ImageStorageConfig.restaurantSlug(" pizzeria-roma "));
        assertThrows(IllegalStateException.class, () -> ImageStorageConfig.restaurantSlug("Pizzeria Roma"));
        assertThrows(IllegalStateException.class, () -> ImageStorageConfig.restaurantSlug("../other"));
    }
}
