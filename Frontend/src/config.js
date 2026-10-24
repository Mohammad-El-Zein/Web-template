// Zentrale Backend-Adresse für alle Services (per VITE_API_URL überschreibbar, siehe .env.example)
export const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://flavorhaus-mo.up.railway.app").replace(/\/+$/, "");

export const API_URL = `${API_BASE_URL}/api`;

// Kleine Zeile "Website von <name>" im Footer; ohne Namen wird sie nicht angezeigt (url optional)
export const SITE_CREDIT = { name: "", url: "" };
