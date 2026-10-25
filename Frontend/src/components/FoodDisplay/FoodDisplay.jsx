import React, { useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import { useCategories } from "../../context/categoriesContext";
import FoodItem from "../FoodItem/FoodItem";
import "./FoodDisplay.css";
import { useTranslation } from "react-i18next";

// category = "All" oder eine categoryId aus /api/categories
const FoodDisplay = ({ category, searchText }) => {
  const { foodList } = useContext(StoreContext);
  const { categoryName } = useCategories();
  const { t, i18n } = useTranslation();

  const lang = i18n.language;
  const search = searchText.trim().toLowerCase();

  const filteredFoods = foodList.filter((food) => {
    const name = food.name?.[lang] || "";
    const matchesCategory = category === "All" || food.categoryId === category;
    const matchesSearch = name.toLowerCase().includes(search);

    return matchesCategory && matchesSearch;
  });

  if (filteredFoods.length === 0) {
    return (
      <div className="fx-empty">
        <p className="fx-h3">{t("card.noItems")}</p>
      </div>
    );
  }

  return (
    <div className="fx-food-grid">
      {filteredFoods.map((food) => (
        <FoodItem
          key={food.id}
          id={food.id}
          imageUrl={food.imageUrl}
          price={food.price}
          name={food.name?.[lang]}
          description={food.description?.[lang]}
          category={categoryName(food)}
        />
      ))}
    </div>
  );
};

export default FoodDisplay;
