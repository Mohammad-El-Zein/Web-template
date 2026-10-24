package in.MoProjekt.foodweb.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import in.MoProjekt.foodweb.entity.FoodEntity;
import in.MoProjekt.foodweb.entity.OrderEntity;
import in.MoProjekt.foodweb.entity.SiteSettingsEntity;
import in.MoProjekt.foodweb.exception.OrderRejectedException;
import in.MoProjekt.foodweb.io.OrderItem;
import in.MoProjekt.foodweb.io.OrderRequest;
import in.MoProjekt.foodweb.repository.FoodRepository;
import in.MoProjekt.foodweb.repository.OrderRepository;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock private OrderRepository orderRepository;
    @Mock private FoodRepository foodRepository;
    @Mock private UserService userService;
    @Mock private SiteSettingsService siteSettingsService;
    @InjectMocks private OrderServiceImpl orderService;

    private SiteSettingsEntity.Ordering ordering;

    @BeforeEach
    void setUp() {
        ordering = SiteSettingsEntity.Ordering.builder()
                .deliveryFee(3.0).minOrderAmount(0).pickupEnabled(true).deliveryEnabled(true)
                .ordersOnlyDuringOpeningHours(false).build();
        lenient().when(siteSettingsService.getSettings())
                .thenAnswer(inv -> SiteSettingsEntity.builder().ordering(ordering).build());
    }

    private void pizzaInDatabase() {
        FoodEntity pizza = FoodEntity.builder().id("p1").name(Map.of("de", "Pizza")).price(12.90).category("Pizza").build();
        when(foodRepository.findById("p1")).thenReturn(Optional.of(pizza));
    }

    private void orderCanBeSaved() {
        when(userService.findByUserId()).thenReturn("u1");
        when(orderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private OrderRequest pizzaOrder(int quantity, String orderType) {
        OrderItem item = OrderItem.builder().foodId("p1").quantity(quantity).build();
        return OrderRequest.builder().orderedItems(List.of(item)).orderType(orderType).build();
    }

    @Test
    void amountIsCalculatedFromDatabasePrices() throws Exception {
        pizzaInDatabase();
        orderCanBeSaved();

        // Browser schickt manipulierten Preis und Betrag
        OrderItem item = OrderItem.builder().foodId("p1").quantity(2).price(0.01).build();
        OrderRequest request = OrderRequest.builder().orderedItems(List.of(item)).amount(0.01).orderStatus("DELIVERED").build();

        OrderEntity order = orderService.createOrderWithPayment(request);

        assertEquals(28.80, order.getAmount(), 0.0001);
        assertEquals(12.90, order.getOrderedItems().get(0).getPrice(), 0.0001);
        assertEquals("Pizza", order.getOrderedItems().get(0).getName());
        assertEquals("PENDING", order.getOrderStatus());
        assertEquals("PENDING", order.getPaymentStatus());
        assertEquals("u1", order.getUserId());
        assertEquals(OrderType.DELIVERY, order.getOrderType());
    }

    @Test
    void invalidQuantityIsRejected() {
        OrderItem item = OrderItem.builder().foodId("p1").quantity(0).build();
        OrderRequest request = OrderRequest.builder().orderedItems(List.of(item)).build();
        assertThrows(ResponseStatusException.class, () -> orderService.createOrderWithPayment(request));
    }

    @Test
    void deliveryFeeComesFromSettings() throws Exception {
        ordering.setDeliveryFee(4.50);
        pizzaInDatabase();
        orderCanBeSaved();

        OrderEntity order = orderService.createOrderWithPayment(pizzaOrder(1, null));

        assertEquals(17.40, order.getAmount(), 0.0001);
        assertEquals(4.50, order.getDeliveryFee(), 0.0001);
    }

    @Test
    void pickupHasNoDeliveryFee() throws Exception {
        pizzaInDatabase();
        orderCanBeSaved();

        OrderEntity order = orderService.createOrderWithPayment(pizzaOrder(1, OrderType.PICKUP));

        assertEquals(12.90, order.getAmount(), 0.0001);
        assertEquals(OrderType.PICKUP, order.getOrderType());
    }

    @Test
    void orderBelowMinimumIsRejected() throws Exception {
        ordering.setMinOrderAmount(15.0);
        pizzaInDatabase();

        OrderRejectedException ex = assertThrows(OrderRejectedException.class,
                () -> orderService.createOrderWithPayment(pizzaOrder(1, null)));
        assertEquals(OrderRejectedException.MIN_ORDER_NOT_REACHED, ex.getCode());
        assertEquals(15.0, ex.getDetails().get("minOrderAmount"));
        verify(orderRepository, never()).save(any());

        // Liefergebühr zählt nicht zum Mindestbestellwert, 2 Pizzen = 25,80 € reichen
        orderCanBeSaved();
        assertEquals(28.80, orderService.createOrderWithPayment(pizzaOrder(2, null)).getAmount(), 0.0001);
    }

    @Test
    void closedRestaurantRejectsOrdersOnlyWhenEnabled() throws Exception {
        when(siteSettingsService.isOpenNow()).thenReturn(false);
        ordering.setOrdersOnlyDuringOpeningHours(true);

        OrderRejectedException ex = assertThrows(OrderRejectedException.class,
                () -> orderService.createOrderWithPayment(pizzaOrder(1, null)));
        assertEquals(OrderRejectedException.RESTAURANT_CLOSED, ex.getCode());

        // Schalter aus: Bestellung trotz geschlossenem Restaurant möglich
        ordering.setOrdersOnlyDuringOpeningHours(false);
        pizzaInDatabase();
        orderCanBeSaved();
        assertEquals(15.90, orderService.createOrderWithPayment(pizzaOrder(1, null)).getAmount(), 0.0001);
    }

    @Test
    void disabledOrderTypesAreRejected() {
        ordering.setDeliveryEnabled(false);
        OrderRejectedException delivery = assertThrows(OrderRejectedException.class,
                () -> orderService.createOrderWithPayment(pizzaOrder(1, OrderType.DELIVERY)));
        assertEquals(OrderRejectedException.DELIVERY_DISABLED, delivery.getCode());

        ordering.setDeliveryEnabled(true);
        ordering.setPickupEnabled(false);
        OrderRejectedException pickup = assertThrows(OrderRejectedException.class,
                () -> orderService.createOrderWithPayment(pizzaOrder(1, OrderType.PICKUP)));
        assertEquals(OrderRejectedException.PICKUP_DISABLED, pickup.getCode());
    }

    @Test
    void unknownOrderTypeIsRejected() {
        assertThrows(ResponseStatusException.class,
                () -> orderService.createOrderWithPayment(pizzaOrder(1, "DRONE")));
    }
}
