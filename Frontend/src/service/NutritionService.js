import axios from "axios";

export const analyzeNutrition = async (foodName, portion) => {
  const response = await axios.post("https://flavorhaus-mo.up.railway.app/api/nutrition/analyze", {
    foodName,
    portion
  });
  return response.data;
};