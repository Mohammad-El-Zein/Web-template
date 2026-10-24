import React, { useRef, useEffect } from "react";
import { useCategories } from "../../context/categoriesContext";
import { localized } from "../../util/settings";
import "./ExploreMenu.css";
import ScrollReveal from "scrollreveal";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ExploreMenu = ({ category, setCategory }) => {
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  // Kategorien aus /api/categories (nur aktive, sortiert)
  const { categories } = useCategories();

  const scrollLeft = () => {
    if (menuRef.current) {
      menuRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (menuRef.current) {
      menuRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const sr = ScrollReveal({
      origin: "top",
      distance: "60px",
      duration: 1800,
      delay: 400,
    });

    sr.reveal(".explore-menu", {
      origin: "left",
    });
  }, []);

  const handleCategoryClick = (itemCategory) => {
    if (location.pathname === "/explore") {
      setCategory(itemCategory);
    } else {
      navigate("/explore", { state: { category: itemCategory } });
    }
  };

  return (
    <div className="explore-menu position-relative">
      <div className="d-flex align-items-center justify-content-between my-title">
        {/* Überschrift kannst du auch auf einen eigenen Key legen, z. B. menu.title */}
        <h3 className="text-center ">
          {t("menu.title", "Unsere Speisekarte")}
        </h3>

        <div className="d-flex ms-3">
          <i
            className="bi bi-arrow-left-circle scroll-icon"
            onClick={scrollLeft}
          ></i>
          <i
            className="bi bi-arrow-right-circle scroll-icon"
            onClick={scrollRight}
          ></i>
        </div>
      </div>

      <div
        className="d-flex justify-content-between gap-4 overflow-auto explore-menu-list"
        ref={menuRef}
      >
        {categories.map((item) => {
          const name = localized(item.name, i18n.language);
          const isActive =
            item.id === category && location.pathname === "/explore";

          return (
            <div
              key={item.id}
              className="text-center explore-menu-list-item"
              onClick={() => handleCategoryClick(item.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCategoryClick(item.id);
              }}
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={name}
                  className={`rounded-circle ${isActive ? "active" : ""}`}
                  height={100}
                  width={128}
                />
              ) : (
                // Ohne Bild: runder Platzhalter mit Anfangsbuchstaben im gleichen Format
                <span className={`category-chip rounded-circle ${isActive ? "active" : ""}`} aria-hidden="true">
                  {name.charAt(0)}
                </span>
              )}
              <p className="mt-2 fwbold">{name}</p>
            </div>
          );
        })}
      </div>

      <hr />
    </div>
  );
};

export default ExploreMenu;