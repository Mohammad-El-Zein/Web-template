import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchCategories } from "../service/categoryService";
import { localized } from "../util/settings";
import { CategoriesContext } from "./categoriesContext";

// Lädt die aktiven Kategorien in der aktuellen Sprache (neu bei Sprachwechsel)
export const CategoriesProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchCategories(lang)
      .then((list) => { if (!cancelled) setCategories(Array.isArray(list) ? list : []); })
      .catch(() => { if (!cancelled) setCategories([]); });
    return () => { cancelled = true; };
  }, [lang]);

  // Name der Kategorie eines Gerichts; ältere Gerichte ohne categoryId behalten ihren Text
  const categoryName = useCallback((food) => {
    const category = categories.find((c) => c.id === food?.categoryId);
    return category ? localized(category.name, lang) : food?.category || "";
  }, [categories, lang]);

  const value = useMemo(() => ({ categories, categoryName }), [categories, categoryName]);

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
};
