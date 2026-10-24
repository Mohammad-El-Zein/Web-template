package in.MoProjekt.foodweb.service;

import com.stripe.exception.StripeException;

import in.MoProjekt.foodweb.entity.OrderEntity;
import in.MoProjekt.foodweb.io.PaymentResponse;

public interface PaymentService {

    public PaymentResponse createPaymentLink(OrderEntity orderEntity) throws StripeException;

    // Fragt Stripe, ob die Bestellung bezahlt wurde, und aktualisiert den Status
    public OrderEntity verifyPayment(String orderId) throws StripeException;

    public OrderEntity cancelPayment(String orderId) throws StripeException;

    public void handleWebhook(String payload, String signatureHeader);
}
