import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://flavorhaus-mo.up.railway.app';
const TOKEN_KEY = 'adminToken';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Nach 60 Sekunden ohne Antwort abbrechen, statt endlos zu warten
const api = axios.create({ baseURL: `${BASE_URL}/api`, timeout: 60000 });

// Token bei jeder Anfrage mitschicken
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token abgelaufen oder kein Admin -> abmelden
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if ((status === 401 || status === 403) && getToken()) {
      clearToken();
      window.dispatchEvent(new Event('admin-logout'));
    }
    return Promise.reject(error);
  }
);

export default api;
