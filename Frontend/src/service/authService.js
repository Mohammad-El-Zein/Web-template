import axios from "axios";
import { API_URL } from "../config";

export const registerUser = async (data) => {
  return axios.post(API_URL + "/register", data);
}

export const login = async (data) => {
  return axios.post(API_URL + "/login", data);
}
