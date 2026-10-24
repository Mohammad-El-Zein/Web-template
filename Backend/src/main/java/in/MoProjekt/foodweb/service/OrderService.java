package in.MoProjekt.foodweb.service;

import java.util.List;

import in.MoProjekt.foodweb.entity.OrderEntity;
import in.MoProjekt.foodweb.io.OrderRequest;

public interface OrderService {

    OrderEntity createOrderWithPayment(OrderRequest request) throws Exception;

    List<OrderEntity> getAllOrders();

    OrderEntity updateOrderStatus(String orderId, String orderStatus);
}
