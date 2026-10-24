import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from './de';
import en from './en';
import ar from './ar';

export const LANGUAGES = [
  { code: 'de', label: 'Deutsch', flag: '/flags/de.svg', locale: 'de-DE' },
  { code: 'en', label: 'English', flag: '/flags/en.svg', locale: 'en-GB' },
  { code: 'ar', label: 'العربية', flag: '/flags/ar.svg', locale: 'ar', dir: 'rtl' },
];

const STORAGE_KEY = 'adminLang';

const savedLanguage = () => {
  try {
    const lang = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.some((l) => l.code === lang) ? lang : 'de';
  } catch {
    return 'de';
  }
};

// Arabisch wird von rechts nach links angezeigt
const applyLanguage = (lng) => {
  const language = LANGUAGES.find((l) => l.code === lng) || LANGUAGES[0];
  document.documentElement.lang = language.code;
  document.documentElement.dir = language.dir || 'ltr';
  try {
    localStorage.setItem(STORAGE_KEY, language.code);
  } catch {
    // Speicher nicht verfügbar (z. B. privates Fenster)
  }
};

i18n.on('languageChanged', applyLanguage);

i18n.use(initReactI18next).init({
  resources: { de: { translation: de }, en: { translation: en }, ar: { translation: ar } },
  lng: savedLanguage(),
  fallbackLng: 'de',
  interpolation: { escapeValue: false },
});

applyLanguage(i18n.language);

// Zahlen und Daten im Format der gewählten Sprache (Ziffern bleiben lateinisch)
export const currentLocale = () => {
  const language = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];
  return language.code === 'ar' ? 'ar-u-nu-latn' : language.locale;
};

export const formatPrice = (value) =>
  new Intl.NumberFormat(currentLocale(), { style: 'currency', currency: 'EUR' }).format(Number(value) || 0);

export const formatDate = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat(currentLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
};

// Text eines Gerichts in der gewählten Sprache (sonst Englisch, sonst Deutsch)
export const localizedText = (value, lang = i18n.language) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.en || value.de || Object.values(value)[0] || '';
};

export default i18n;
