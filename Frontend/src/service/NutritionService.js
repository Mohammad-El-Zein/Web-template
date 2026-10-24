import axios from "axios";
import { API_URL } from "../config";

export const analyzeNutrition = async (foodName, portion) => {
  const response = await axios.post(`${API_URL}/nutrition/analyze`, {
    foodName,
    portion
  });
  return response.data;
};