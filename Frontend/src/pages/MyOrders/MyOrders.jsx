import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import { getMyOrders } from "../../service/orderService";
import "./MyOrders.css";
import { useTranslation } from "react-i18next";

const MyOrders = () => {
  const { token } = useContext(StoreContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getMyOrders(token));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchOrders();
  }, [token, fetchOrders]);

  const formatDate = (str) => {
    const date = new Date(str);
    return (
      date.toLocaleDateString("de-DE") +
      " " +
      date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <main className="fx-page">
      <div className="fx-wrap">
        <header className="fx-page-head fx-head">
          <div>
            <span className="fx-tag">{t("pages.accountTag")}</span>
            <h1 className="fx-h1">{t("myOrders.title")}</h1>
          </div>
          {token && data.length > 0 && (
            <button type="button" className="fx-btn fx-btn-outline fx-btn-small" onClick={fetchOrders} disabled={loading}>
              <i className="bi bi-arrow-clockwise" aria-hidden="true"></i> {t("myOrders.refresh")}
            </button>
          )}
        </header>

        {!token ? (
          <div className="fx-empty">
            <p className="fx-h3">{t("myOrders.loginFirst")}</p>
            <Link to="/login" className="fx-btn fx-btn-primary">{t("navbar.login")}</Link>
          </div>
        ) : data.length === 0 ? (
          <div className="fx-empty">
            <p className="fx-h3">{loading ? t("general.loading") : t("myOrders.empty")}</p>
            {!loading && <Link to="/explore" className="fx-btn fx-btn-primary">{t("cart.toMenu")}</Link>}
          </div>
        ) : (
          <ul className="fx-orders">
            {data.map((order, index) => (
              <li key={order.id || index} className="fx-order">
                <div className="fx-order-head">
                  <span className="fx-order-date fx-num">{formatDate(order.createdAt)}</span>
                  <span className={`fx-order-status is-${(order.orderStatus || "PENDING").toLowerCase()}`}>
                    {t(`orderStatus.${order.orderStatus || "PENDING"}`)}
                  </span>
                </div>
                <p className="fx-order-items">
                  {order.orderedItems.map((item) => `${item.name} × ${item.quantity}`).join(", ")}
                </p>
                <div className="fx-order-foot">
                  <span className="fx-order-count">{order.orderedItems.length} {t("myorders.c")}</span>
                  <span className="fx-order-amount fx-num">{order.amount.toFixed(2)} €</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
};

export default MyOrders;
