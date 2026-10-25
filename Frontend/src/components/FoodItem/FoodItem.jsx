import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { StoreContext } from "../../context/StoreContext";
import FoodImage from "../FoodImage/FoodImage";
import AiNutrition from "../AiNutrition/AiNutrition";
import QuantityStepper from "../QuantityStepper/QuantityStepper";
import "./FoodItem.css";

// Karte eines Gerichts auf der Speisekarte (name, description, category = Texte in der aktuellen Sprache)
const FoodItem = ({ name = "", description = "", category = "", id, imageUrl, price }) => {
  const { increaseQty, quantities } = useContext(StoreContext);
  const { t } = useTranslation();
  const qty = quantities[id] || 0;

  const handleAdd = () => {
    increaseQty(id);
    toast.success(t("messages.addedToCart"), { autoClose: 2000 });
  };

  return (
    <article className="fx-food">
      <Link to={`/food/${id}`} className="fx-food-photo" tabIndex={-1} aria-hidden="true">
        <FoodImage src={imageUrl} alt="" loading="lazy" />
      </Link>

      <div className="fx-food-body">
        {category && <p className="fx-food-line">{category}</p>}
        <h3 className="fx-food-name">
          <Link to={`/food/${id}`}>{name}</Link>
        </h3>
        {description && <p className="fx-food-desc">{description}</p>}

        <div className="fx-food-ai">
          <AiNutrition name={name} />
        </div>

        <div className="fx-food-foot">
          <span className="fx-price">{Number(price).toFixed(2)} {t("card.priceSuffix")}</span>
          {qty > 0 ? (
            <QuantityStepper id={id} />
          ) : (
            <button type="button" className="fx-btn fx-btn-primary fx-btn-small" onClick={handleAdd}>
              <i className="bi bi-plus-lg" aria-hidden="true"></i> {t("card.addToCart")}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default FoodItem;
