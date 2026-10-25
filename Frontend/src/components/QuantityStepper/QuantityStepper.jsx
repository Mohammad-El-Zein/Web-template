import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { StoreContext } from "../../context/StoreContext";

// Menge eines Gerichts im Warenkorb ändern (– Anzahl +)
const QuantityStepper = ({ id }) => {
  const { increaseQty, decreaseQty, quantities } = useContext(StoreContext);
  const { t } = useTranslation();

  return (
    <div className="fx-stepper">
      <button type="button" onClick={() => decreaseQty(id)} aria-label={t("card.decrease")}>
        <i className="bi bi-dash-lg" aria-hidden="true"></i>
      </button>
      <span aria-live="polite">{quantities[id] || 0}</span>
      <button type="button" onClick={() => increaseQty(id)} aria-label={t("card.increase")}>
        <i className="bi bi-plus-lg" aria-hidden="true"></i>
      </button>
    </div>
  );
};

export default QuantityStepper;
