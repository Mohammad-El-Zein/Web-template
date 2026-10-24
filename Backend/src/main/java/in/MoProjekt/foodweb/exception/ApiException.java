package in.MoProjekt.foodweb.exception;

import java.util.Map;

import lombok.Getter;

// Fachlicher Fehler (HTTP 400) mit Code für das Frontend und optionalen Zusatzfeldern
@Getter
public class ApiException extends RuntimeException {

    private final String code;
    // Zusätzliche Felder für die Antwort, z. B. minOrderAmount oder field
    private final Map<String, Object> details;

    public ApiException(String code, String message, Map<String, Object> details) {
        super(message);
        this.code = code;
        this.details = details;
    }
}
