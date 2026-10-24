import axios from "axios";
import { API_URL } from "../config";

// Alle restaurantspezifischen Einstellungen (Name, Farben, Bestellung, Öffnungszeiten, Sprachen)
export const fetchSettings = async () => {
  const response = await axios.get(`${API_URL}/settings`, { timeout: 10000 });
  return response.data;
};
