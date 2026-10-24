import { DEFAULT_ACCENT, DEFAULT_PRIMARY } from "./settings";

// Setzt die Markenfarben als CSS-Variablen. Bei den FlavorHaus-Standardfarben bleibt alles wie in index.css
// (dort stehen die exakten bisherigen Farbtöne), sonst werden die Varianten aus den zwei Grundfarben berechnet.

const HEX = /^#[0-9a-fA-F]{6}$/;

const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (rgb) => `#${rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;
// amount > 0 mischt mit Weiß, amount < 0 mit Schwarz
const mix = (rgb, amount) => rgb.map((v) => (amount >= 0 ? v + (255 - v) * amount : v * (1 + amount)));

// Abstand der bisherigen FlavorHaus-Töne zur Akzentfarbe #f6ba20
const ACCENT_VARIANTS = {
  "--accent-dark": -0.08,        // #e3a619 (Hover)
  "--accent-dark-2": -0.09,      // #e0a218 (Kontakt-Knopf Hover)
  "--accent-medium": -0.05,      // #eab11e (Knopf im Header)
  "--accent-strong": -0.06,      // #e9b000 (Bestellen-Knopf)
  "--accent-strong-dark": -0.19, // #c99300 (Bestellen-Knopf Hover)
  "--accent-light": 0.38,        // #ffd37a (Hover-Text in der Menüleiste)
  "--accent-soft": 0.86,         // #fdf3e1 (Sprachmenü Hover)
  "--accent-soft-2": 0.7,        // #fbe7c0 (Sprachmenü aktiv)
  "--accent-tint": 0.82,         // #fff2d9 (KI-Ergebnis)
};

const ACCENT_PROPERTIES = ["--accent", "--accent-rgb", "--accent-glow-rgb", "--accent-shadow-rgb", ...Object.keys(ACCENT_VARIANTS)];
const PRIMARY_PROPERTIES = ["--primary", "--primary-rgb"];

export const applyTheme = (primaryColor, accentColor) => {
  const style = document.documentElement.style;

  const primary = (primaryColor || "").toLowerCase();
  if (HEX.test(primary) && primary !== DEFAULT_PRIMARY) {
    style.setProperty("--primary", primary);
    style.setProperty("--primary-rgb", toRgb(primary).join(", "));
  } else {
    PRIMARY_PROPERTIES.forEach((p) => style.removeProperty(p));
  }

  const accent = (accentColor || "").toLowerCase();
  if (HEX.test(accent) && accent !== DEFAULT_ACCENT) {
    const rgb = toRgb(accent);
    style.setProperty("--accent", accent);
    style.setProperty("--accent-rgb", rgb.join(", "));
    style.setProperty("--accent-glow-rgb", rgb.join(", "));
    style.setProperty("--accent-shadow-rgb", rgb.join(", "));
    Object.entries(ACCENT_VARIANTS).forEach(([property, amount]) => style.setProperty(property, toHex(mix(rgb, amount))));
  } else {
    ACCENT_PROPERTIES.forEach((p) => style.removeProperty(p));
  }
};
