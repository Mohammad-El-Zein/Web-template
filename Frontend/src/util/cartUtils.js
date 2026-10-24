// Summen des Warenkorbs; Liefergebühr und Mindestbestellwert kommen aus den Einstellungen.
// Abholung kostet keine Liefergebühr, der Mindestbestellwert gilt für die Zwischensumme.
export const calculateCartTotals = (cartItems, quantities, { deliveryFee = 0, minOrderAmount = 0, orderType = "DELIVERY" } = {}) => {

    const subtotal = cartItems.reduce((acc, food) => acc + food.price * quantities[food.id], 0);
    const shipping = subtotal === 0 || orderType === "PICKUP" ? 0.0 : deliveryFee;
    const total = subtotal + shipping ;
    // Rundung, damit 14.999999 nicht als "unter 15" zählt
    const missing = Math.max(0, Math.round((minOrderAmount - subtotal) * 100) / 100);
    const minReached = missing === 0;

    return {subtotal, shipping, total, minReached, missing};
}
