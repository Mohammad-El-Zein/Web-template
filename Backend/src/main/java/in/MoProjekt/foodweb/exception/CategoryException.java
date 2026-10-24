package in.MoProjekt.foodweb.exception;

import java.util.Map;

// Fehler bei Kategorien (HTTP 400)
public class CategoryException extends ApiException {

    public static final String CATEGORY_INVALID = "CATEGORY_INVALID";
    public static final String CATEGORY_NOT_EMPTY = "CATEGORY_NOT_EMPTY";

    private CategoryException(String code, String message, Map<String, Object> details) {
        super(code, message, details);
    }

    public static CategoryException invalid(String field, String message) {
        return new CategoryException(CATEGORY_INVALID, message, Map.of("field", field));
    }

    public static CategoryException notEmpty(long foodCount) {
        return new CategoryException(CATEGORY_NOT_EMPTY,
                "Category still has " + foodCount + " foods", Map.of("foodCount", foodCount));
    }
}
