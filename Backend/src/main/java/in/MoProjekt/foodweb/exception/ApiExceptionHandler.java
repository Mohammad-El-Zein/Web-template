package in.MoProjekt.foodweb.exception;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

// Fachliche Fehler als JSON { "code": ..., "message": ... }, damit das Frontend sie übersetzen kann
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(OrderRejectedException.class)
    public ResponseEntity<Map<String, Object>> orderRejected(OrderRejectedException ex) {
        Map<String, Object> body = body(ex.getCode(), ex.getMessage());
        body.putAll(ex.getDetails());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(SettingsValidationException.class)
    public ResponseEntity<Map<String, Object>> settingsInvalid(SettingsValidationException ex) {
        Map<String, Object> body = body(SettingsValidationException.CODE, ex.getMessage());
        body.put("field", ex.getField());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    private Map<String, Object> body(String code, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("code", code);
        body.put("message", message);
        return body;
    }
}
