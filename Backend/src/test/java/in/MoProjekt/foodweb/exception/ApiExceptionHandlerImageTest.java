package in.MoProjekt.foodweb.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

class ApiExceptionHandlerImageTest {

    // Spring lehnt Dateien über spring.servlet.multipart.max-file-size schon vor dem Controller ab
    @Test
    void springUploadLimitReturnsImageTooLarge() {
        ResponseEntity<Map<String, Object>> response = new ApiExceptionHandler()
                .uploadTooLarge(new MaxUploadSizeExceededException(5L * 1024 * 1024));

        assertEquals(400, response.getStatusCode().value());
        assertEquals("IMAGE_TOO_LARGE", response.getBody().get("code"));
        assertEquals(5L * 1024 * 1024, response.getBody().get("maxBytes"));
        assertEquals("Image must not be larger than 5 MB", response.getBody().get("message"));
    }
}
