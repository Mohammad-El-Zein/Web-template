package in.MoProjekt.foodweb.service;

import java.util.Set;

// Lieferung oder Abholung (fehlt der Wert in der Anfrage, gilt DELIVERY)
public final class OrderType {

    public static final String DELIVERY = "DELIVERY";
    public static final String PICKUP = "PICKUP";

    public static final Set<String> ALL = Set.of(DELIVERY, PICKUP);

    private OrderType() {
    }
}
