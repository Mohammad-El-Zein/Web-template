import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpApi from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

export const LANGUAGES = [
  { code: "de", label: "Deutsch", flag: "/flags/de.svg" },
  { code: "en", label: "English", flag: "/flags/en.svg" },
  { code: "ar", label: "العربية", flag: "/flags/ar.svg", dir: "rtl" },
];

// Arabisch wird von rechts nach links angezeigt
const applyDirection = (lng) => {
  const language = LANGUAGES.find((l) => l.code === lng);
  document.documentElement.lang = lng;
  document.documentElement.dir = language?.dir || "ltr";
};

i18n.on("languageChanged", applyDirection);

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: LANGUAGES.map((l) => l.code),
    fallbackLng: "de",
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: "/locales/{{lng}}/translation.json",
    },
    // gewählte Sprache merken, beim ersten Besuch Deutsch
    detection: {
      order: ["localStorage"],
      lookupLocalStorage: "lang",
      caches: ["localStorage"],
    },
  });

export default i18n;
