import axios from "axios";
import { API_URL } from "../config";

// Sichtbare Bewertungen, sortiert; Text nur in der gewünschten Sprache, z. B. { "ar": "..." }
export const fetchReviews = async (lang) => {
  const response = await axios.get(`${API_URL}/reviews`, { params: { lang } });
  return response.data;
};
