package in.MoProjekt.foodweb.exception;

import java.util.Map;

// Ungültige Bewertung (HTTP 400), field nennt das betroffene Feld, z. B. "rating" oder "text.en"
public class ReviewException extends ApiException {

    public static final String REVIEW_INVALID = "REVIEW_INVALID";

    private ReviewException(String code, String message, Map<String, Object> details) {
        super(code, message, details);
    }

    public static ReviewException invalid(String field, String message) {
        return new ReviewException(REVIEW_INVALID, message, Map.of("field", field));
    }
}
