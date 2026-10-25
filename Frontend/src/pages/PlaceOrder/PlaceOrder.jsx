import React, { useContext, useState } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";
import { calculateCartTotals } from "../../util/cartUtils";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { createOrder } from "../../service/orderService";
import { useSettings } from "../../context/settingsContext";
import { orderErrorCode, orderErrorMessage } from "../../util/orderErrors";
import OrderNotice from "../../components/OrderNotice/OrderNotice";
import { useOrderAvailability } from "../../components/OrderNotice/useOrderAvailability";

const ORDER_TYPES = ["DELIVERY", "PICKUP"];

// Wandelt name/description IMMER sicher in String um
const safeText = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object")
    return value.de || Object.values(value)[0] || "";
  return "";
};

const PlaceOrder = () => {
  const { foodList, quantities, token } = useContext(StoreContext);
  const { t } = useTranslation();
  const { settings, reloadSettings } = useSettings();
  const { ordering } = settings;
  const { blocked } = useOrderAvailability();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  // Lieferung oder Abholung; Auswahl nur, wenn beides möglich ist
  const [chosenType, setChosenType] = useState("DELIVERY");
  const [submitting, setSubmitting] = useState(false);

  const showTypeChoice = ordering.deliveryEnabled && ordering.pickupEnabled;
  const orderType = showTypeChoice ? chosenType : ordering.deliveryEnabled ? "DELIVERY" : "PICKUP";
  const isDelivery = orderType === "DELIVERY";

  const cartItems = foodList.filter((food) => quantities[food.id] > 0);

  const { subtotal, shipping, total, minReached, missing } = calculateCartTotals(
    cartItems,
    quantities,
    { deliveryFee: ordering.deliveryFee, minOrderAmount: ordering.minOrderAmount, orderType }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      alert(t("messages.loginRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const orderedItems = cartItems.map((item) => ({
        foodId: item.id,
        quantity: quantities[item.id],
        price: item.price,
        name: safeText(item.name),
        description: safeText(item.description),
        imageUrl: item.imageUrl,
        category: item.category,
      }));

      const orderRequest = {
        orderedItems,
        // Bei Abholung wird keine Adresse gebraucht
        userAddress: isDelivery ? `${address}, ${zip}` : "",
        amount: total,
        email,
        phoneNumber,
        orderStatus: "PENDING",
        orderType,
      };

      const response = await createOrder(orderRequest, token);

      if (response.paymentUrl) {
        window.location.href = response.paymentUrl;
      }
    } catch (error) {
      toast.error(orderErrorMessage(error, t));
      // Einstellungen könnten sich geändert haben (z. B. Mindestbestellwert) -> neu laden
      if (orderErrorCode(error)) reloadSettings();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="fx-page">
      <div className="fx-wrap">
        <header className="fx-page-head">
          <span className="fx-tag">{t("pages.orderTag")}</span>
          <h1 className="fx-h1">{t("placeOrder.title")}</h1>
        </header>

        <div className="fx-checkout">
          {/* FORMULAR */}
          <div>
            <OrderNotice />
            <form onSubmit={handleSubmit} className="fx-card fx-checkout-form">
              <h2 className="fx-h3">{t("placeOrder.detailsTitle")}</h2>

              <div className="fx-form-grid">
                {/* LIEFERUNG ODER ABHOLUNG */}
                {showTypeChoice && (
                  <div className="fx-field fx-span-6">
                    <span className="fx-field-label">{t("orderType.label")}</span>
                    <div className="order-type-options" role="radiogroup" aria-label={t("orderType.label")}>
                      {ORDER_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          role="radio"
                          aria-checked={orderType === type}
                          className={`order-type-option ${orderType === type ? "active" : ""}`}
                          onClick={() => setChosenType(type)}
                        >
                          <i className={`bi ${type === "DELIVERY" ? "bi-truck" : "bi-bag"}`} aria-hidden="true"></i>
                          {t(`orderType.${type}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {!isDelivery && (
                  <p className="order-type-hint fx-span-6">{t("orderType.pickupHint")}</p>
                )}

                <div className="fx-field fx-span-3">
                  <label htmlFor="po-first">{t("placeOrder.firstName")}</label>
                  <input
                    id="po-first"
                    type="text"
                    className="form-control"
                    placeholder={t("placeOrder.firstNamePlaceholder")}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                    required
                  />
                </div>

                <div className="fx-field fx-span-3">
                  <label htmlFor="po-last">{t("placeOrder.lastName")}</label>
                  <input
                    id="po-last"
                    type="text"
                    className="form-control"
                    placeholder={t("placeOrder.lastNamePlaceholder")}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                    required
                  />
                </div>

                <div className="fx-field fx-span-3">
                  <label htmlFor="po-email">{t("placeOrder.email")}</label>
                  <input
                    id="po-email"
                    type="email"
                    className="form-control"
                    placeholder={t("placeOrder.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="fx-field fx-span-3">
                  <label htmlFor="po-phone">{t("placeOrder.phone")}</label>
                  <input
                    id="po-phone"
                    type="tel"
                    className="form-control"
                    placeholder={t("placeOrder.phonePlaceholder")}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    autoComplete="tel"
                    required
                  />
                </div>

                {/* Adresse nur bei Lieferung */}
                {isDelivery && (
                  <>
                    <div className="fx-field fx-span-6">
                      <label htmlFor="po-address">{t("placeOrder.address")}</label>
                      <input
                        id="po-address"
                        type="text"
                        className="form-control"
                        placeholder={t("placeOrder.addressPlaceholder")}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        autoComplete="street-address"
                        required
                      />
                    </div>

                    <div className="fx-field fx-span-2">
                      <label htmlFor="po-country">{t("placeOrder.country")}</label>
                      <select
                        id="po-country"
                        className="form-select"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        required
                      >
                        <option value="">{t("placeOrder.countryPlaceholder")}</option>
                        <option value="Deutschland">{t("placeOrder.a")}</option>
                      </select>
                    </div>

                    <div className="fx-field fx-span-2">
                      <label htmlFor="po-state">{t("placeOrder.state")}</label>
                      <select
                        id="po-state"
                        className="form-select"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        required
                      >
                        <option value="">{t("placeOrder.statePlaceholder")}</option>
                        <option value="Nordrhein-Westfalen">{t("placeOrder.b")}</option>
                      </select>
                    </div>

                    <div className="fx-field fx-span-2">
                      <label htmlFor="po-zip">{t("placeOrder.zip")}</label>
                      <input
                        id="po-zip"
                        type="text"
                        className="form-control"
                        placeholder={t("placeOrder.zipPlaceholder")}
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        autoComplete="postal-code"
                        required
                      />
                    </div>
                  </>
                )}

                {/* ABSCHICKEN */}
                <div className="fx-span-6 fx-checkout-submit">
                  {cartItems.length > 0 && !minReached && (
                    <p className="fx-hint cart-min-order">
                      <i className="bi bi-info-circle" aria-hidden="true"></i>
                      <span>
                        {t("cart.minOrderMissing", {
                          min: `${ordering.minOrderAmount.toFixed(2)} €`,
                          missing: `${missing.toFixed(2)} €`,
                        })}
                      </span>
                    </p>
                  )}
                  <button
                    className="fx-btn fx-btn-primary fx-btn-block placeorder-btn"
                    type="submit"
                    disabled={cartItems.length === 0 || !minReached || blocked || submitting}
                  >
                    {t("placeOrder.submit")}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* ÜBERSICHT */}
          <aside className="fx-card fx-summary">
            <h2 className="fx-h3 fx-checkout-summary-title">
              <span>{t("cart.title")}</span>
              <span className="fx-checkout-count">{cartItems.length}</span>
            </h2>

            <ul className="fx-checkout-items">
              {cartItems.map((item) => (
                <li key={item.id}>
                  <div>
                    <span className="fx-checkout-name">{safeText(item.name)}</span>
                    <small>{t("cart.quantity")}: {quantities[item.id]}</small>
                  </div>
                  <span className="fx-num">{(item.price * quantities[item.id]).toFixed(2)} €</span>
                </li>
              ))}
            </ul>

            <dl className="fx-summary-lines">
              <div>
                <dt>{t("cart.shipping")}</dt>
                <dd className="fx-num">{subtotal === 0 ? "0.00" : shipping.toFixed(2)} €</dd>
              </div>
              <div className="fx-summary-total">
                <dt>{t("cart.total")}</dt>
                <dd className="fx-num">{total.toFixed(2)} €</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default PlaceOrder;
