import React, { useContext, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { StoreContext } from "../../context/StoreContext";
import { cancelPayment } from "../../service/orderService";
import "../Login/Login.css";
import "../PaymentSuccess/PaymentSuccess.css";

const PaymentFailure = () => {
  const { t } = useTranslation();
  const { orderId } = useParams();
  const { token } = useContext(StoreContext);

  // Bestellung als storniert markieren (Backend prüft vorher bei Stripe)
  useEffect(() => {
    const authToken = token || localStorage.getItem("token");
    if (authToken) {
      cancelPayment(orderId, authToken).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  return (
    <main className="fx-page fx-auth">
      <div className="fx-card fx-auth-card fx-result" role="status">
        <span className="fx-result-icon is-error"><i className="bi bi-x-lg" aria-hidden="true"></i></span>
        <span className="fx-tag">{t("pages.paymentTag")}</span>
        <h1 className="fx-h2">{t("payment.fail")}</h1>
        <p className="fx-result-text">{t("payment.failDesc1")}</p>
        <p className="fx-result-text">{t("payment.failDesc2")}</p>
        <Link to="/cart" className="fx-btn fx-btn-primary fx-btn-block">{t("navbar.cart")}</Link>
        <Link to="/" className="fx-link fx-result-link">{t("payment.backHome")}</Link>
      </div>
    </main>
  );
};

export default PaymentFailure;
