import React from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../context/settingsContext";
import { nextOpening } from "../../util/openingHours";
import { useOrderAvailability } from "./useOrderAvailability";
import "./OrderNotice.css";

// Ruhiger Hinweis, wenn gerade nicht bestellt werden kann (geschlossen oder keine Bestellart aktiv)
const OrderNotice = () => {
  const { t } = useTranslation();
  const { settings, now } = useSettings();
  const { blocked, reason } = useOrderAvailability();
  if (!blocked) return null;

  let next = "";
  if (reason === "closed") {
    const opening = nextOpening(settings.openingHours, now);
    if (opening?.daysAhead === 0) next = t("orderNotice.opensToday", { time: opening.time });
    else if (opening?.daysAhead === 1) next = t("orderNotice.opensTomorrow", { time: opening.time });
    else if (opening) next = t("orderNotice.opensOn", { day: t(`days.${opening.weekday}`), time: opening.time });
  }

  return (
    <div className="order-notice" role="status">
      <i className={`bi ${reason === "closed" ? "bi-clock" : "bi-info-circle"}`} aria-hidden="true"></i>
      <p>
        {reason === "closed" ? t("orderNotice.closed") : t("orderNotice.noOrderTypes")}
        {next && <> {next}</>}
      </p>
    </div>
  );
};

export default OrderNotice;
