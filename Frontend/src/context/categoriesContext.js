import { createContext, useContext } from "react";

// Kategorien aus /api/categories (siehe CategoriesProvider)
export const CategoriesContext = createContext({ categories: [], categoryName: () => "" });

export const useCategories = () => useContext(CategoriesContext);
