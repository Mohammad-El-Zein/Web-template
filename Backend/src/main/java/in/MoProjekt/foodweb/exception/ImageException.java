package in.MoProjekt.foodweb.exception;

import java.util.Map;

// Ungültiges oder zu großes Bild (HTTP 400)
public class ImageException extends ApiException {

    public static final String IMAGE_INVALID = "IMAGE_INVALID";
    public static final String IMAGE_TOO_LARGE = "IMAGE_TOO_LARGE";

    private ImageException(String code, String message, Map<String, Object> details) {
        super(code, message, details);
    }

    public static ImageException invalid(String field, String message) {
        return new ImageException(IMAGE_INVALID, message, Map.of("field", field));
    }

    public static ImageException tooLarge(long maxBytes) {
        return new ImageException(IMAGE_TOO_LARGE,
                "Image must not be larger than " + (maxBytes / (1024 * 1024)) + " MB", Map.of("maxBytes", maxBytes));
    }
}
