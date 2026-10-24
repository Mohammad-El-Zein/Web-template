package in.MoProjekt.foodweb.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.*;

import in.MoProjekt.foodweb.entity.OrderEntity;
import in.MoProjekt.foodweb.service.OrderService;
import lombok.AllArgsConstructor;

// Nur für Admins (siehe SecurityConfig: /api/admin/**)
@RestController
@RequestMapping("/api/admin/orders")
@AllArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping
    public List<OrderEntity> getAllOrders() {
        return orderService.getAllOrders();
    }

    @PatchMapping("/{id}/status")
    public OrderEntity updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        return orderService.updateOrderStatus(id, body.get("orderStatus"));
    }
}
