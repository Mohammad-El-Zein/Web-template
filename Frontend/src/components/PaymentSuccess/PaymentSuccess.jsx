import React, { useContext, useEffect, useState } from "react";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import Card from "@mui/material/Card";
import { useNavigate, useParams } from "react-router-dom";
import { Button, CircularProgress } from "@mui/material";
import { green, orange } from "@mui/material/colors";
import { useTranslation } from "react-i18next";
import { StoreContext } from "../../context/StoreContext";
import { verifyPayment } from "../../service/orderService";

const PaymentSuccess = () => {
  const navigate = useNavigate();
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
      <section className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6 col-md-8">
              <Card
                className="p-5 shadow-sm bg-white text-center"
                style={{ borderRadius: "12px" }}
              >
                {state === "checking" ? (
                  <CircularProgress sx={{ margin: "0 auto" }} />
                ) : (
                  <HourglassTopIcon sx={{ fontSize: "5rem", color: orange[500] }} />
                )}

                <h1 className="py-4 text-2xl fw-bold">
                  {state === "checking" ? t("payment.checking") : t("payment.pending")}
                </h1>

                {state === "pending" && (
                  <p className="text-muted mb-4">{t("payment.pendingDesc")}</p>
                )}

                <Button
                  variant="contained"
                  onClick={() => navigate("/myorders")}
                  className="w-100 py-2"
                  disabled={state === "checking"}
                >
                  {t("payment.toMyOrders")}
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8">
            <Card
              className="p-5 shadow-sm bg-white text-center"
              style={{ borderRadius: "12px" }}
            >
              <TaskAltIcon sx={{ fontSize: "5rem", color: green[500] }} />

              <h1 className="py-4 text-2xl fw-bold">
                {t("payment.success")}
              </h1>

              <p className="text-muted mb-2">
                {t("payment.successDesc1")}
              </p>

              <p className="text-muted mb-4">
                {t("payment.successDesc2")}
              </p>

              <Button
                variant="contained"
                onClick={() => navigate("/")}
                className="w-100 py-2"
              >
                {t("payment.backHome")}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PaymentSuccess;
