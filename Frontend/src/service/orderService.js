import axios from "axios";
import { API_URL as BASE_API_URL } from "../config";

const API_URL = `${BASE_API_URL}/orders`;

const authHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

// Liefert { paymentUrl } (Stripe), Fehler kommen als { code, message } vom Backend
export const createOrder = async (orderRequest, token) => {
  const response = await axios.post(`${API_URL}/create`, orderRequest, authHeader(token));
  return response.data;
};

export const getMyOrders = async (token) => {
  const response = await axios.get(API_URL, authHeader(token));
  return response.data;
};

// Backend fragt bei Stripe nach, ob die Bestellung wirklich bezahlt wurde
export const verifyPayment = async (orderId, token) => {
  const response = await axios.post(`${API_URL}/${orderId}/verify`, null, authHeader(token));
  return response.data;
};

export const cancelPayment = async (orderId, token) => {
  const response = await axios.post(`${API_URL}/${orderId}/cancel`, null, authHeader(token));
  return response.data;
};
