package in.MoProjekt.foodweb.service;

import java.util.Set;

// Mögliche Werte für orderStatus und PaymentStatus einer Bestellung
public final class OrderStatus {

    public static final String PENDING = "PENDING";
    public static final String PREPARING = "PREPARING";
    public static final String OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY";
    public static final String DELIVERED = "DELIVERED";
    public static final String CANCELLED = "CANCELLED";

    public static final Set<String> ALL = Set.of(PENDING, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED);

    public static final String PAYMENT_PENDING = "PENDING";
    public static final String PAYMENT_PAID = "PAID";
    public static final String PAYMENT_FAILED = "FAILED";

    private OrderStatus() {
    }
}
