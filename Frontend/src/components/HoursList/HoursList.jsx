import React from "react";
import { useTranslation } from "react-i18next";
import "./HoursList.css";

// Öffnungszeiten als Liste mit feinen Linien; heute hervorgehoben. days aus useRestaurant()
const HoursList = ({ days }) => {
  const { t } = useTranslation();

  return (
    <ul className="fx-hours">
      {days.map((d) => (
        <li key={d.day} className={d.today ? "is-today" : ""}>
          <span className="fx-hours-day">
            {d.label}
            {d.today && <em className="fx-hours-badge">{t("hours.today")}</em>}
          </span>
          <span className="fx-hours-time">
            {d.slots
              // Jedes Zeitfenster bleibt in einer Zeile, umgebrochen wird nur dazwischen
              ? d.slots.split(", ").map((slot) => <span key={slot} dir="ltr">{slot}</span>)
              : <span className="fx-hours-closed">{t("hours.closed")}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default HoursList;
