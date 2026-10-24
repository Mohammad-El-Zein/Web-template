package in.MoProjekt.foodweb.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
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
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import in.MoProjekt.foodweb.entity.FoodEntity;
import in.MoProjekt.foodweb.entity.OrderEntity;
import in.MoProjekt.foodweb.io.OrderItem;
import in.MoProjekt.foodweb.io.OrderRequest;
import in.MoProjekt.foodweb.repository.FoodRepository;
import in.MoProjekt.foodweb.repository.OrderRepository;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock private OrderRepository orderRepository;
    @Mock private FoodRepository foodRepository;
    @Mock private UserService userService;
    @InjectMocks private OrderServiceImpl orderService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(orderService, "shippingFee", 3.0);
    }

    @Test
    void amountIsCalculatedFromDatabasePrices() throws Exception {
        FoodEntity pizza = FoodEntity.builder().id("p1").name(Map.of("de", "Pizza")).price(12.90).category("Pizza").build();
        when(foodRepository.findById("p1")).thenReturn(Optional.of(pizza));
        when(userService.findByUserId()).thenReturn("u1");
        when(orderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

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
    }

    @Test
    void invalidQuantityIsRejected() {
        OrderItem item = OrderItem.builder().foodId("p1").quantity(0).build();
        OrderRequest request = OrderRequest.builder().orderedItems(List.of(item)).build();
        assertThrows(ResponseStatusException.class, () -> orderService.createOrderWithPayment(request));
    }
}
