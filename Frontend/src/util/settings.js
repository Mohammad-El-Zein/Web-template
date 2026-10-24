// Standardwerte (FlavorHaus), falls /api/settings nicht erreichbar ist
export const SUPPORTED_LANGUAGES = ["de", "en", "ar"];
export const WEEKDAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export const DEFAULT_PRIMARY = "#9a401c";
export const DEFAULT_ACCENT = "#f6ba20";

export const DEFAULT_SETTINGS = {
  restaurantName: "FlavorHaus",
  slogan: {
    de: "Bestell dein Lieblingsessen direkt bei uns.",
    en: "Order your favorite meals directly from us.",
    ar: "اطلب وجباتك المفضلة مباشرة منا.",
  },
  logoUrl: "",
  faviconUrl: "",
  primaryColor: DEFAULT_PRIMARY,
  accentColor: DEFAULT_ACCENT,
  ordering: {
    deliveryFee: 3,
    minOrderAmount: 0,
    pickupEnabled: true,
    deliveryEnabled: true,
    ordersOnlyDuringOpeningHours: false,
  },
  openingHours: {
    timeZone: "Europe/Berlin",
    days: Object.fromEntries(WEEKDAYS.map((day) => [day, [{ open: "11:00", close: "22:00" }]])),
  },
  enabledLanguages: [...SUPPORTED_LANGUAGES],
  defaultLanguage: "de",
};

const number = (value, fallback) => (Number.isFinite(Number(value)) && value !== null && value !== "" ? Number(value) : fallback);

// Fehlende oder kaputte Felder mit Standardwerten auffüllen, damit die Seite nie bricht
export const normalizeSettings = (data) => {
  const s = data && typeof data === "object" ? data : {};
  const d = DEFAULT_SETTINGS;
  const ordering = s.ordering || {};
  const enabled = (Array.isArray(s.enabledLanguages) ? s.enabledLanguages : []).filter((l) => SUPPORTED_LANGUAGES.includes(l));
  const languages = enabled.length ? enabled : d.enabledLanguages;
  const days = s.openingHours?.days;
  return {
    ...s,
    restaurantName: s.restaurantName || d.restaurantName,
    slogan: s.slogan && typeof s.slogan === "object" ? s.slogan : d.slogan,
    logoUrl: s.logoUrl || "",
    faviconUrl: s.faviconUrl || "",
    primaryColor: s.primaryColor || d.primaryColor,
    accentColor: s.accentColor || d.accentColor,
    ordering: {
      deliveryFee: number(ordering.deliveryFee, d.ordering.deliveryFee),
      minOrderAmount: number(ordering.minOrderAmount, d.ordering.minOrderAmount),
      pickupEnabled: ordering.pickupEnabled ?? d.ordering.pickupEnabled,
      deliveryEnabled: ordering.deliveryEnabled ?? d.ordering.deliveryEnabled,
      ordersOnlyDuringOpeningHours: ordering.ordersOnlyDuringOpeningHours ?? d.ordering.ordersOnlyDuringOpeningHours,
    },
    openingHours: {
      timeZone: s.openingHours?.timeZone || d.openingHours.timeZone,
      days: days && typeof days === "object"
        ? Object.fromEntries(WEEKDAYS.map((day) => [day, Array.isArray(days[day]) ? days[day] : []]))
        : d.openingHours.days,
    },
    enabledLanguages: languages,
    defaultLanguage: languages.includes(s.defaultLanguage) ? s.defaultLanguage : languages[0],
  };
};

// Text in der gewählten Sprache (sonst Englisch, sonst Deutsch)
export const localized = (texts, lang) => {
  if (!texts) return "";
  if (typeof texts === "string") return texts;
  return texts[lang] || texts.en || texts.de || "";
};
