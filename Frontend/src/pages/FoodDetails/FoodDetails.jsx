import React, { useContext, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchFoodDetails } from "../../service/foodService";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import "./FoodDetails.css";
import { useTranslation } from "react-i18next";
import FoodImage from "../../components/FoodImage/FoodImage";
import AiNutrition from "../../components/AiNutrition/AiNutrition";
import QuantityStepper from "../../components/QuantityStepper/QuantityStepper";
import { useCategories } from "../../context/categoriesContext";

const FoodDetails = () => {
  const { id } = useParams();
  const { increaseQty, quantities } = useContext(StoreContext);
  const { t, i18n } = useTranslation();
  const [data, setData] = useState({});

  const lang = i18n.language;
  const rtl = i18n.dir(lang) === "rtl";

  // Kategoriename in der aktuellen Sprache (aus /api/categories)
  const { categoryName } = useCategories();

  const name =
    typeof data.name === "object"
      ? data.name?.[lang] || data.name?.de || ""
      : data.name || "";

  const desc =
    typeof data.description === "object"
      ? data.description?.[lang] || data.description?.de || ""
      : data.description || "";

  useEffect(() => {
    const loadFoodDetails = async () => {
      try {
        const foodData = await fetchFoodDetails(id);
        setData(foodData);
      } catch {
        toast.error(t("messages.fetchFoodError"));
      }
    };
    loadFoodDetails();
  }, [id, t]);

  const addToCart = () => {
    if (!data.id) return;
    increaseQty(data.id);
    toast.success(t("messages.addedToCart"));
  };

  return (
    <main className="fx-page">
      <div className="fx-wrap">
        <Link to="/explore" className="fx-back">
          <i className={`bi ${rtl ? "bi-arrow-right" : "bi-arrow-left"}`} aria-hidden="true"></i>
          {t("foodDetails.back")}
        </Link>

        <div className="fx-detail">
          <div className="fx-detail-photo">
            <FoodImage src={data.imageUrl} alt={name} />
          </div>

          <div className="fx-detail-info">
            {categoryName(data) && <span className="fx-tag">{categoryName(data)}</span>}
            <h1 className="fx-h1">{name}</h1>
            {data.price != null && <p className="fx-detail-price">{Number(data.price).toFixed(2)} €</p>}
            {desc && <p className="fx-detail-desc">{desc}</p>}

            <div className="fx-detail-ai">
              <AiNutrition name={name} />
            </div>

            <div className="fx-detail-actions">
              {quantities[data.id] > 0 ? (
                <>
                  <QuantityStepper id={data.id} />
                  <Link to="/cart" className="fx-link">
                    {t("navbar.cart")} <i className={`bi ${rtl ? "bi-arrow-left" : "bi-arrow-right"}`} aria-hidden="true"></i>
                  </Link>
                </>
              ) : (
                <button type="button" className="fx-btn fx-btn-primary" onClick={addToCart} disabled={!data.id}>
                  <i className="bi bi-bag-plus" aria-hidden="true"></i>
                  {t("foodDetails.addToCart")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default FoodDetails;
