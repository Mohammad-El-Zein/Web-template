package in.MoProjekt.foodweb.exception;

import lombok.Getter;

// Ungültige Einstellungen (HTTP 400), field nennt das betroffene Feld, z. B. "primaryColor"
@Getter
public class SettingsValidationException extends RuntimeException {

    public static final String CODE = "SETTINGS_INVALID";

    private final String field;

    public SettingsValidationException(String field, String message) {
        super(message);
        this.field = field;
    }
}
