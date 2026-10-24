package in.MoProjekt.foodweb.exception;

import java.util.Map;

import lombok.Getter;

// Bestellung abgelehnt (HTTP 400). Der Code wird im Frontend in de/en/ar übersetzt.
@Getter
public class OrderRejectedException extends RuntimeException {

    public static final String RESTAURANT_CLOSED = "RESTAURANT_CLOSED";
    public static final String MIN_ORDER_NOT_REACHED = "MIN_ORDER_NOT_REACHED";
    public static final String DELIVERY_DISABLED = "DELIVERY_DISABLED";
    public static final String PICKUP_DISABLED = "PICKUP_DISABLED";

    private final String code;
    // Zusätzliche Felder für die Antwort, z. B. minOrderAmount
    private final Map<String, Object> details;

    public OrderRejectedException(String code, String message) {
        this(code, message, Map.of());
    }

    public OrderRejectedException(String code, String message, Map<String, Object> details) {
        super(message);
        this.code = code;
        this.details = details;
    }
}
