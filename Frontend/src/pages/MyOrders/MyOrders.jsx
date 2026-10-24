import React, { useCallback, useContext, useEffect, useState } from "react";
import { StoreContext } from "../../context/StoreContext";
import { getMyOrders } from "../../service/orderService";
import "./MyOrders.css";
import { useTranslation } from "react-i18next";

const MyOrders = () => {
  const { token } = useContext(StoreContext);
  const [data, setData] = useState([]);
  const { t } = useTranslation();

  const fetchOrders = useCallback(async () => {
    setData(await getMyOrders(token));
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
    <div className="container">
      <div className="py-5 row justify-content-center">
        <div className="col-11 card">
          <table className="table table-responsive">
            <tbody>
              {data.map((order, index) => (
                <tr key={index}>
                  <td style={{ width: "60px" }}>
                    <img src="/logo.png" alt="Logo" className="order-logo" />
                  </td>

                  <td>
                    {order.orderedItems.map((item, idx) => {
                      const entry = `${item.name} X ${item.quantity}`;
                      return idx === order.orderedItems.length - 1
                        ? entry
                        : entry + ", ";
                    })}
                  </td>

                  <td>{order.amount.toFixed(2)} €</td>

                  <td>
                    {order.orderedItems.length} {t("myorders.c")}
                  </td>

                  <td>{formatDate(order.createdAt)}</td>

                  <td>
                    <span className="badge bg-secondary">
                      {t(`orderStatus.${order.orderStatus || "PENDING"}`)}
                    </span>
                  </td>

                  <td>
                    <button
                      className="btn btn-sm btn-warning"
                      onClick={fetchOrders}
                    >
                      <i className="bi bi-arrow-clockwise"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyOrders;
