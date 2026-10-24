import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchSettings } from "../service/settingsService";
import { hasSavedLanguage } from "../i18n";
import { DEFAULT_SETTINGS, localized, normalizeSettings } from "../util/settings";
import { applyTheme } from "../util/theme";
import { isOpenAt } from "../util/openingHours";
import { SettingsContext } from "./settingsContext";
import { assets } from "../assets/assets";

const CACHE_KEY = "siteSettings";

const readCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? normalizeSettings(JSON.parse(cached)) : null;
  } catch {
    return null;
  }
};

const writeCache = (settings) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
  } catch {
    // Speicher nicht verfügbar (z. B. privates Fenster)
  }
};

// Favicon aus den Einstellungen, sonst das Logo
const setFavicon = (url) => {
  let link = document.querySelector("link[rel='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.removeAttribute("type");
  link.href = url || assets.logo;
};

// Lädt die Einstellungen einmal beim Start. Beim ersten Besuch wird gewartet (neutraler Spinner),
// danach kommen sie sofort aus dem Cache und werden im Hintergrund aktualisiert.
export const SettingsProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [cached] = useState(readCache);
  const [settings, setSettings] = useState(cached || DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => new Date());

  // Sprache passend zu den Einstellungen wählen
  const applyLanguage = useCallback(async (next) => {
    const current = i18n.resolvedLanguage || i18n.language;
    const target = !hasSavedLanguage || !next.enabledLanguages.includes(current) ? next.defaultLanguage : current;
    if (target !== current || !hasSavedLanguage) await i18n.changeLanguage(target);
  }, [i18n]);

  const load = useCallback(async () => {
    try {
      const next = normalizeSettings(await fetchSettings());
      writeCache(next);
      setSettings(next);
      return next;
    } catch {
      // Backend nicht erreichbar: mit Cache bzw. Standardwerten weiterarbeiten
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      if (cached) {
        // Sofort anzeigen, im Hintergrund aktualisieren
        await applyLanguage(cached);
        if (!cancelled) setReady(true);
        const fresh = await load();
        if (fresh && !cancelled) await applyLanguage(fresh);
        return;
      }
      const fresh = await load();
      await applyLanguage(fresh || DEFAULT_SETTINGS);
      if (!cancelled) setReady(true);
    };
    start();
    return () => { cancelled = true; };
  }, [cached, load, applyLanguage]);

  // Farben, Favicon und Titel des Browser-Tabs
  useEffect(() => {
    applyTheme(settings.primaryColor, settings.accentColor);
    setFavicon(settings.faviconUrl);
  }, [settings.primaryColor, settings.accentColor, settings.faviconUrl]);

  useEffect(() => {
    const slogan = localized(settings.slogan, i18n.language);
    document.title = slogan ? `${settings.restaurantName} – ${slogan}` : settings.restaurantName;
  }, [settings.restaurantName, settings.slogan, i18n.language]);

  // Öffnungszeiten jede Minute neu prüfen
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const isOpenNow = useMemo(() => isOpenAt(settings.openingHours, now), [settings.openingHours, now]);

  const value = useMemo(() => ({
    settings,
    isOpenNow,
    // Bestellen ist erlaubt, wenn nicht nur während der Öffnungszeiten bestellt werden darf oder gerade geöffnet ist
    canOrderNow: !settings.ordering.ordersOnlyDuringOpeningHours || isOpenNow,
    logo: settings.logoUrl || assets.logo,
    reloadSettings: load,
    now,
  }), [settings, isOpenNow, load, now]);

  if (!ready) {
    return (
      <div className="settings-loading" role="status" aria-live="polite">
        <span className="spinner-border" aria-hidden="true"></span>
        <span className="visually-hidden">Loading</span>
      </div>
    );
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
