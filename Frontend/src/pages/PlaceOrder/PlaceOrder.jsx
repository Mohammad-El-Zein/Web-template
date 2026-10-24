import React, { useContext, useState } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";
import { calculateCartTotals } from "../../util/cartUtils";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { getFoodImageById } from "../../assets/assets";
import { createOrder } from "../../service/orderService";
import { useSettings } from "../../context/settingsContext";
import { orderErrorCode, orderErrorMessage } from "../../util/orderErrors";
import OrderNotice from "../../components/OrderNotice/OrderNotice";
import { useOrderAvailability } from "../../components/OrderNotice/useOrderAvailability";

const ORDER_TYPES = ["DELIVERY", "PICKUP"];

const PlaceOrder = () => {
  const { foodList, quantities, token } = useContext(StoreContext);
  const { t } = useTranslation();
  const { settings, logo, reloadSettings } = useSettings();
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

  // Wandelt name/description IMMER sicher in String um
  const safeText = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object")
      return value.de || Object.values(value)[0] || "";
    return "";
  };

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
        name: safeText(item.name), // FIXED
        description: safeText(item.description), // FIXED
        imageUrl: getFoodImageById(item.id, item.category),
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
    <div className="container placeorder-container mt-4">
      <div className="text-center mb-4">
        <img src={logo} alt={settings.restaurantName} width="120" className="mb-3" />
        <h2>{t("placeOrder.title")}</h2>
      </div>

      <div className="row g-5">
        {/* LEFT FORM */}
        <div className="col-lg-7">
          <OrderNotice />
          <div className="form-box p-4 shadow-sm rounded-4 bg-white">
            <h4 className="mb-4 fw-semibold">{t("placeOrder.detailsTitle")}</h4>

            <form onSubmit={handleSubmit} className="row g-3">
              {/* LIEFERUNG ODER ABHOLUNG */}
              {showTypeChoice && (
                <div className="col-12">
                  <span className="form-label d-block">{t("orderType.label")}</span>
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
                <div className="col-12">
                  <p className="order-type-hint">{t("orderType.pickupHint")}</p>
                </div>
              )}

              {/* FIRST NAME */}
              <div className="col-md-6">
                <label className="form-label">
                  {t("placeOrder.firstName")}
                </label>
                <input
                  type="text"
                  className="form-control custom-input"
                  placeholder={t("placeOrder.firstNamePlaceholder")}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              {/* LAST NAME */}
              <div className="col-md-6">
                <label className="form-label">{t("placeOrder.lastName")}</label>
                <input
                  type="text"
                  className="form-control custom-input"
                  placeholder={t("placeOrder.lastNamePlaceholder")}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              {/* EMAIL */}
              <div className="col-12">
                <label className="form-label">{t("placeOrder.email")}</label>
                <input
                  type="email"
                  className="form-control custom-input"
                  placeholder={t("placeOrder.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* PHONE */}
              <div className="col-12">
                <label className="form-label">{t("placeOrder.phone")}</label>
                <input
                  type="tel"
                  className="form-control custom-input"
                  placeholder={t("placeOrder.phonePlaceholder")}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>

              {/* Adresse nur bei Lieferung */}
              {isDelivery && (
                <>
                  {/* ADDRESS */}
                  <div className="col-12">
                    <label className="form-label">{t("placeOrder.address")}</label>
                    <input
                      type="text"
                      className="form-control custom-input"
                      placeholder={t("placeOrder.addressPlaceholder")}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>

                  {/* COUNTRY */}
                  <div className="col-md-5">
                    <label className="form-label">{t("placeOrder.country")}</label>
                    <select
                      className="form-select custom-input"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required
                    >
                      <option value="">{t("placeOrder.countryPlaceholder")}</option>
                      <option value="Deutschland">{t("placeOrder.a")}</option>
                    </select>
                  </div>

                  {/* STATE */}
                  <div className="col-md-4">
                    <label className="form-label">{t("placeOrder.state")}</label>
                    <select
                      className="form-select custom-input"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                    >
                      <option value="">{t("placeOrder.statePlaceholder")}</option>
                      <option value="Nordrhein-Westfalen">
                        {t("placeOrder.b")}
                      </option>
                    </select>
                  </div>

                  {/* ZIP */}
                  <div className="col-md-3">
                    <label className="form-label">{t("placeOrder.zip")}</label>
                    <input
                      type="text"
                      className="form-control custom-input"
                      placeholder={t("placeOrder.zipPlaceholder")}
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {/* SUBMIT */}
              <div className="col-12 mt-3">
                {cartItems.length > 0 && !minReached && (
                  <p className="cart-min-order mt-0">
                    <i className="bi bi-info-circle" aria-hidden="true"></i>{" "}
                    {t("cart.minOrderMissing", {
                      min: `${ordering.minOrderAmount.toFixed(2)} €`,
                      missing: `${missing.toFixed(2)} €`,
                    })}
                  </p>
                )}
                <button
                  className="placeorder-btn"
                  type="submit"
                  disabled={cartItems.length === 0 || !minReached || blocked || submitting}
                >
                  {t("placeOrder.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT CART SUMMARY */}
        <div className="col-lg-5">
          <div className="cart-box shadow-sm p-4 rounded-4 bg-white">
            <h4 className="d-flex justify-content-between align-items-center mb-3">
              <span className="fw-semibold">{t("cart.title")}</span>
              <span className="badge bg-warning text-dark rounded-pill">
                {cartItems.length}
              </span>
            </h4>

            <ul className="list-group mb-3">
              {cartItems.map((item) => (
                <li
                  key={item.id}
                  className="list-group-item d-flex justify-content-between lh-sm border-0 pb-2"
                >
                  <div>
                    <h6 className="my-0 fw-medium">{safeText(item.name)}</h6>
                    <small className="text-muted">
                      {t("cart.quantity")}: {quantities[item.id]}
                    </small>
                  </div>
                  <span className="fw-semibold">
                    {(item.price * quantities[item.id]).toFixed(2)}€
                  </span>
                </li>
              ))}

              <li className="list-group-item d-flex justify-content-between border-0">
                <span>{t("cart.shipping")}</span>
                <span>
                  {subtotal === 0 ? "0.00€" : shipping.toFixed(2) + "€"}
                </span>
              </li>

              <li className="list-group-item d-flex justify-content-between border-0 mt-2 pt-2 border-top">
                <strong>{t("cart.total")}</strong>
                <strong>{total.toFixed(2)}€</strong>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrder;
