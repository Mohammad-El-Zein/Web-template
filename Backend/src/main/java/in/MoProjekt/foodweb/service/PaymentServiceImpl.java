package in.MoProjekt.foodweb.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.stripe.exception.StripeException;

import in.MoProjekt.foodweb.entity.OrderEntity;
import in.MoProjekt.foodweb.io.PaymentResponse;
import in.MoProjekt.foodweb.repository.CartRepository;
import in.MoProjekt.foodweb.repository.OrderRepository;


@Service
public class PaymentServiceImpl implements PaymentService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private UserService userService;

    @Value("${stripePublishableKey}")
    private String stripePublishableKey;
    @Value("${stripeSecretKey}")
    private String stripeSecretKey;
    @Value("${stripeWebhookSecret}")
    private String stripeWebhookSecret;
    @Value("${frontend.url}")
    private String frontendUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public PaymentResponse createPaymentLink(OrderEntity orderEntity) throws StripeException {
        // create Stripe payment order

        com.stripe.Stripe.apiKey = stripeSecretKey;

        SessionCreateParams params = SessionCreateParams.builder().addPaymentMethodType(
                SessionCreateParams.PaymentMethodType.CARD)
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(frontendUrl + "/payment/success/" + orderEntity.getId())
                .setCancelUrl(frontendUrl + "/payment/fail/" + orderEntity.getId())
                .putMetadata("orderId", orderEntity.getId())
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency("eur")
                                                // Betrag in Cent, z. B. 12.90 € -> 1290
                                                .setUnitAmount(Math.round(orderEntity.getAmount() * 100))
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData
                                                                .builder()
                                                                .setName("Order #"
                                                                        + orderEntity.getId())
                                                                .build())
                                                .build())
                                .build())
                .build();


        Session session = Session.create(params);

        orderEntity.setStripeSessionId(session.getId());
        orderRepository.save(orderEntity);

        PaymentResponse res = new PaymentResponse();
        res.setPaymentUrl(session.getUrl());
        res.setOrderId(orderEntity.getId());
        return res;
    }

    @Override
    public OrderEntity verifyPayment(String orderId) throws StripeException {
        OrderEntity order = findOwnOrder(orderId);
        return syncWithStripe(order);
    }

    @Override
    public OrderEntity cancelPayment(String orderId) throws StripeException {
        OrderEntity order = syncWithStripe(findOwnOrder(orderId));
        if (!OrderStatus.PAYMENT_PAID.equals(order.getPaymentStatus())) {
            order.setPaymentStatus(OrderStatus.PAYMENT_FAILED);
            order.setOrderStatus(OrderStatus.CANCELLED);
            order = orderRepository.save(order);
        }
        return order;
    }

    @Override
    public void handleWebhook(String payload, String signatureHeader) {
        if (stripeWebhookSecret == null || stripeWebhookSecret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Webhook not configured");
        }
        Event event;
        try {
            event = Webhook.constructEvent(payload, signatureHeader, stripeWebhookSecret);
        } catch (SignatureVerificationException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid signature");
        }

        if (!event.getType().startsWith("checkout.session.")) {
            return;
        }
        try {
            String sessionId = objectMapper.readTree(payload).path("data").path("object").path("id").asText();
            OrderEntity order = orderRepository.findByStripeSessionId(sessionId).orElse(null);
            if (order != null) {
                syncWithStripe(order);
            }
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Webhook processing failed");
        }
    }

    // Status nie vom Browser übernehmen, sondern immer direkt bei Stripe nachfragen
    private OrderEntity syncWithStripe(OrderEntity order) throws StripeException {
        if (OrderStatus.PAYMENT_PAID.equals(order.getPaymentStatus()) || order.getStripeSessionId() == null) {
            return order;
        }
        com.stripe.Stripe.apiKey = stripeSecretKey;
        Session session = Session.retrieve(order.getStripeSessionId());

        if ("paid".equals(session.getPaymentStatus())) {
            order.setPaymentStatus(OrderStatus.PAYMENT_PAID);
            if (OrderStatus.PENDING.equals(order.getOrderStatus()) || OrderStatus.CANCELLED.equals(order.getOrderStatus())) {
                order.setOrderStatus(OrderStatus.PREPARING);
            }
            order = orderRepository.save(order);
            cartRepository.deleteByUserId(order.getUserId());
        } else if ("expired".equals(session.getStatus())) {
            order.setPaymentStatus(OrderStatus.PAYMENT_FAILED);
            order.setOrderStatus(OrderStatus.CANCELLED);
            order = orderRepository.save(order);
        }
        return order;
    }

    private OrderEntity findOwnOrder(String orderId) {
        String userId = userService.findByUserId();
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!userId.equals(order.getUserId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
        }
        return order;
    }
}
