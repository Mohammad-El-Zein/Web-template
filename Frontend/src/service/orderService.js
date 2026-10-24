import axios from "axios";

const API_URL = "https://flavorhaus-mo.up.railway.app/api/orders";

const authHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

// Backend fragt bei Stripe nach, ob die Bestellung wirklich bezahlt wurde
export const verifyPayment = async (orderId, token) => {
  const response = await axios.post(`${API_URL}/${orderId}/verify`, null, authHeader(token));
  return response.data;
};

export const cancelPayment = async (orderId, token) => {
  const response = await axios.post(`${API_URL}/${orderId}/cancel`, null, authHeader(token));
  return response.data;
};
