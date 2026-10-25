import React, { useContext } from "react";
import "./Cart.css";
import { StoreContext } from "../../context/StoreContext";
import { Link, useNavigate } from "react-router-dom";
import { calculateCartTotals } from "../../util/cartUtils";
import { useTranslation } from "react-i18next";
import FoodImage from "../../components/FoodImage/FoodImage";
import QuantityStepper from "../../components/QuantityStepper/QuantityStepper";
import { useCategories } from "../../context/categoriesContext";
import { useSettings } from "../../context/settingsContext";
import OrderNotice from "../../components/OrderNotice/OrderNotice";
import { useOrderAvailability } from "../../components/OrderNotice/useOrderAvailability";

// Falls name oder description noch ein altes Objekt ist -> String extrahieren
const safeText = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return value.de || Object.values(value)[0] || "";
  return "";
};

const Cart = () => {
  const navigate = useNavigate();
  const { foodList, quantities, removeFromCart, token } = useContext(StoreContext);
  const { t, i18n } = useTranslation();
  const rtl = i18n.dir() === "rtl";
  // Kategoriename in der aktuellen Sprache (aus /api/categories)
  const { categoryName } = useCategories();

  const cartItems = foodList.filter((food) => quantities[food.id] > 0);

  // Liefergebühr und Mindestbestellwert aus den Einstellungen; nur Abholung möglich -> keine Liefergebühr
  const { settings } = useSettings();
  const { ordering } = settings;
  const { blocked } = useOrderAvailability();
  const { subtotal, shipping, total, minReached, missing } = calculateCartTotals(
    cartItems,
    quantities,
    {
      deliveryFee: ordering.deliveryFee,
      minOrderAmount: ordering.minOrderAmount,
      orderType: ordering.deliveryEnabled ? "DELIVERY" : "PICKUP",
    }
  );
  const canCheckout = cartItems.length > 0 && minReached && !blocked;

  const checkout = () => {
    if (!token) {
      alert(t("messages.loginRequired"));
      navigate("/login");
      return;
    }
    navigate("/order");
  };

  return (
    <main className="fx-page">
      <div className="fx-wrap">
        <header className="fx-page-head">
          <span className="fx-tag">{t("pages.orderTag")}</span>
          <h1 className="fx-h1">{t("cart.title")}</h1>
        </header>

        <div className="fx-cart">
          <div>
            {cartItems.length === 0 ? (
              <div className="fx-empty">
                <p className="fx-h3">{t("cart.empty")}</p>
                <p className="mb-0">{t("cart.emptyText")}</p>
                <Link to="/explore" className="fx-btn fx-btn-primary">{t("cart.toMenu")}</Link>
              </div>
            ) : (
              <ul className="fx-cart-list">
                {cartItems.map((food) => {
                  const name = safeText(food.name);
                  const desc = safeText(food.description);

                  return (
                    <li key={food.id} className="fx-cart-item">
                      <Link to={`/food/${food.id}`} className="fx-cart-img" tabIndex={-1} aria-hidden="true">
                        <FoodImage src={food.imageUrl} alt="" />
                      </Link>

                      <div className="fx-cart-info">
                        {categoryName(food) && (
                          <p className="fx-cart-category">
                            <span className="visually-hidden">{t("cart.categoryLabel")}: </span>
                            {categoryName(food)}
                          </p>
                        )}
                        <h2 className="fx-cart-name">
                          <Link to={`/food/${food.id}`}>{name}</Link>
                        </h2>
                        {desc && <p className="fx-cart-desc">{desc}</p>}
                      </div>

                      <div className="fx-cart-qty">
                        <QuantityStepper id={food.id} />
                      </div>

                      <div className="fx-cart-price">
                        <span className="fx-num">{(food.price * quantities[food.id]).toFixed(2)} €</span>
                        <button
                          type="button"
                          className="fx-cart-remove"
                          onClick={() => removeFromCart(food.id)}
                          aria-label={`${t("cart.remove")}: ${name}`}
                        >
                          <i className="bi bi-trash3" aria-hidden="true"></i>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {cartItems.length > 0 && (
              <Link to="/explore" className="fx-back fx-cart-continue">
                <i className={`bi ${rtl ? "bi-arrow-right" : "bi-arrow-left"}`} aria-hidden="true"></i>
                {t("buttons.continueShopping")}
              </Link>
            )}
          </div>

          <aside className="fx-card fx-summary">
            <h2 className="fx-h3">{t("cart.summaryTitle")}</h2>

            <dl className="fx-summary-lines">
              <div>
                <dt>{t("cart.subtotal")}</dt>
                <dd className="fx-num">{subtotal.toFixed(2)} €</dd>
              </div>
              <div>
                <dt>{t("cart.shipping")}</dt>
                <dd className="fx-num">{subtotal === 0 ? "0.00" : shipping.toFixed(2)} €</dd>
              </div>
              <div className="fx-summary-total">
                <dt>{t("cart.total")}</dt>
                <dd className="fx-num">{subtotal === 0 ? "0.00" : total.toFixed(2)} €</dd>
              </div>
            </dl>

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

            <OrderNotice />

            <button
              type="button"
              className="fx-btn fx-btn-primary fx-btn-block btn-checkout"
              disabled={!canCheckout}
              onClick={checkout}
            >
              {t("cart.checkout")}
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default Cart;
