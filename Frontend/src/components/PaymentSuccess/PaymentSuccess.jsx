import React, { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { StoreContext } from "../../context/StoreContext";
import { verifyPayment } from "../../service/orderService";
import "../Login/Login.css";
import "./PaymentSuccess.css";

const PaymentSuccess = () => {
  const { t } = useTranslation();
  const { orderId } = useParams();
  const { token, setQuantities } = useContext(StoreContext);
  // "checking" -> "paid" oder "pending" (Zahlung noch nicht bestätigt)
  const [state, setState] = useState("checking");

  useEffect(() => {
    const authToken = token || localStorage.getItem("token");
    if (!authToken) {
      setState("pending");
      return;
    }
    verifyPayment(orderId, authToken)
      .then((order) => {
        if (order.paymentStatus === "PAID") {
          setQuantities({});
          setState("paid");
        } else {
          setState("pending");
        }
      })
      .catch(() => setState("pending"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (state !== "paid") {
    return (
      <main className="fx-page fx-auth">
        <div className="fx-card fx-auth-card fx-result" role="status">
          {state === "checking" ? (
            <span className="fx-result-icon"><span className="spinner-border spinner-border-sm" aria-hidden="true"></span></span>
          ) : (
            <span className="fx-result-icon"><i className="bi bi-hourglass-split" aria-hidden="true"></i></span>
          )}
          <span className="fx-tag">{t("pages.paymentTag")}</span>
          <h1 className="fx-h2">{state === "checking" ? t("payment.checking") : t("payment.pending")}</h1>
          {state === "pending" && <p className="fx-result-text">{t("payment.pendingDesc")}</p>}
          <Link
            to="/myorders"
            className={`fx-btn fx-btn-primary fx-btn-block ${state === "checking" ? "is-disabled" : ""}`}
            aria-disabled={state === "checking"}
          >
            {t("payment.toMyOrders")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="fx-page fx-auth">
      <div className="fx-card fx-auth-card fx-result" role="status">
        <span className="fx-result-icon is-success"><i className="bi bi-check2" aria-hidden="true"></i></span>
        <span className="fx-tag">{t("pages.paymentTag")}</span>
        <h1 className="fx-h2">{t("payment.success")}</h1>
        <p className="fx-result-text">{t("payment.successDesc1")}</p>
        <p className="fx-result-text">{t("payment.successDesc2")}</p>
        <Link to="/" className="fx-btn fx-btn-primary fx-btn-block">{t("payment.backHome")}</Link>
      </div>
    </main>
  );
};

export default PaymentSuccess;
