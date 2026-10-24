import axios from "axios";
import { API_URL } from "../config";

// Aktive Kategorien, sortiert; Name nur in der gewünschten Sprache, z. B. { "ar": "مشروبات" }
export const fetchCategories = async (lang) => {
  const response = await axios.get(`${API_URL}/categories`, { params: { lang } });
  return response.data;
};
