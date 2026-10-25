import React, { useState, useEffect } from "react";
import FoodDisplay from "../../components/FoodDisplay/FoodDisplay";
import "./ExploreFood.css";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCategories } from "../../context/categoriesContext";
import { localized } from "../../util/settings";

// Speisekarte: Kategorien als Auswahl-Pillen, Suche nach Namen
const ExploreFood = () => {
  const [category, setCategory] = useState("All");
  const [searchText, setSearchText] = useState("");
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { categories } = useCategories();

  // Kategorie aus der Startseite übernehmen (Klick auf eine Kachel)
  useEffect(() => {
    if (location.state && location.state.category) {
      setCategory(location.state.category);
    }
  }, [location.state]);

  const filters = [
    { id: "All", name: t("explorePage.filterAll") },
    ...categories.map((c) => ({ id: c.id, name: localized(c.name, i18n.language) })),
  ];

  return (
    <main className="fx-page">
      <div className="fx-wrap">
        <header className="fx-page-head fx-head">
          <div>
            <span className="fx-tag">{t("pages.menuTag")}</span>
            <h1 className="fx-h1">{t("explorePage.title")}</h1>
          </div>
          <label className="fx-search">
            <span className="visually-hidden">{t("explorePage.searchLabel")}</span>
            <i className="bi bi-search" aria-hidden="true"></i>
            <input
              type="search"
              className="form-control"
              placeholder={t("explorePage.searchPlaceholder")}
              onChange={(e) => setSearchText(e.target.value)}
              value={searchText}
            />
          </label>
        </header>

        {categories.length > 0 && (
          <div className="fx-chips" role="group" aria-label={t("home.categoriesTag")}>
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className="fx-chip"
                aria-pressed={category === filter.id}
                onClick={() => setCategory(filter.id)}
              >
                {filter.name}
              </button>
            ))}
          </div>
        )}

        <FoodDisplay category={category} searchText={searchText} />
      </div>
    </main>
  );
};

export default ExploreFood;
