import { useTranslation } from "react-i18next";
import { useSettings } from "../context/settingsContext";
import { aboutImagesOf, localized, WEEKDAYS } from "./settings";
import { formatDaySlots, todayWeekday } from "./openingHours";

const isWebLink = (url) => /^https?:\/\//i.test(url || "");
const hasText = (texts) => Object.values(texts || {}).some((text) => typeof text === "string" && text.trim());

// Aufbereitete Angaben aus den Einstellungen für Startseite, Kontakt und Footer
export const useRestaurant = () => {
  const { t, i18n } = useTranslation();
  const { settings, now, isOpenNow } = useSettings();
  const lang = i18n.language;
  const hours = settings.openingHours;
  const today = todayWeekday(hours, now);
  const contact = settings.contact || {};
  const days = WEEKDAYS.map((day) => ({
    day,
    label: t(`days.${day}`),
    slots: formatDaySlots(hours, day),
    today: day === today,
  }));
  const aboutImages = aboutImagesOf(settings);

  return {
    settings,
    lang,
    name: settings.restaurantName,
    slogan: localized(settings.slogan, lang),
    days,
    hasHours: days.some((d) => d.slots),
    todaySlots: formatDaySlots(hours, today),
    isOpenNow,
    contact,
    phoneHref: (contact.phone || "").replace(/[^\d+]/g, ""),
    mapsUrl: isWebLink(contact.googleMapsUrl) ? contact.googleMapsUrl : "",
    aboutTitle: localized(settings.aboutTitle, lang),
    aboutText: localized(settings.aboutText, lang),
    aboutImages,
    // "Über uns" nur, wenn es Inhalt gibt
    hasAbout: hasText(settings.aboutTitle) || hasText(settings.aboutText) || aboutImages.length > 0,
  };
};
