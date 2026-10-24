package in.MoProjekt.foodweb.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import in.MoProjekt.foodweb.entity.FoodEntity;
import in.MoProjekt.foodweb.entity.OrderEntity;
import in.MoProjekt.foodweb.io.OrderItem;
import in.MoProjekt.foodweb.io.OrderRequest;
import in.MoProjekt.foodweb.repository.FoodRepository;
import in.MoProjekt.foodweb.repository.OrderRepository;

@Service
public class OrderServiceImpl implements OrderService{

    private static final int MAX_QUANTITY_PER_ITEM = 50;

    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private FoodRepository foodRepository;
    @Autowired
    private UserService userService;

    @Value("${order.shipping-fee}")
    private double shippingFee;

    @Override
    public OrderEntity createOrderWithPayment(OrderRequest request) throws Exception {
        if (request.getOrderedItems() == null || request.getOrderedItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order has no items");
        }

        // Preise und Namen kommen aus der Datenbank, nicht vom Browser
        List<OrderItem> items = new ArrayList<>();
        double subtotal = 0;
        for (OrderItem requested : request.getOrderedItems()) {
            if (requested.getQuantity() < 1 || requested.getQuantity() > MAX_QUANTITY_PER_ITEM) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid quantity");
            }
            FoodEntity food = foodRepository.findById(requested.getFoodId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown food: " + requested.getFoodId()));

            items.add(OrderItem.builder()
                    .foodId(food.getId())
                    .quantity(requested.getQuantity())
                    .price(food.getPrice())
                    .name(germanText(food.getName()))
                    .description(germanText(food.getDescription()))
                    .category(food.getCategory())
                    .imageUrl(food.getImageUrl())
                    .build());
            subtotal += food.getPrice() * requested.getQuantity();
        }
        double amount = Math.round((subtotal + shippingFee) * 100) / 100.0;

        OrderEntity newOrder = convertToEntity(request);
        newOrder.setOrderedItems(items);
        newOrder.setAmount(amount);
        newOrder.setOrderStatus(OrderStatus.PENDING);
        newOrder.setPaymentStatus(OrderStatus.PAYMENT_PENDING);
        String loggedInUserId = userService.findByUserId();
        newOrder.setUserId(loggedInUserId);
        newOrder.setCreatedAt(new java.util.Date());
        return orderRepository.save(newOrder);
    }

    @Override
    public List<OrderEntity> getAllOrders() {
        return orderRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    @Override
    public OrderEntity updateOrderStatus(String orderId, String orderStatus) {
        if (orderStatus == null || !OrderStatus.ALL.contains(orderStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid order status");
        }
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        order.setOrderStatus(orderStatus);
        return orderRepository.save(order);
    }

    private String germanText(Object value) {
        if (value instanceof Map<?, ?> map) {
            Object de = map.get("de");
            if (de != null) return de.toString();
            return map.values().stream().findFirst().map(Object::toString).orElse("");
        }
        return value != null ? value.toString() : "";
    }

    private OrderEntity convertToEntity(OrderRequest request){
        return OrderEntity.builder()
            .userAddress(request.getUserAddress())
            .email(request.getEmail())
            .phoneNumber(request.getPhoneNumber())
            .build();
    }
}
