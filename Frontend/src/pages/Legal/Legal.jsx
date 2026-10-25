import React from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../context/settingsContext";
import { localized } from "../../util/settings";
import "../About/About.css";

// Impressum (field = "imprint") bzw. Datenschutz (field = "privacyPolicy") aus den Einstellungen.
// Reiner Text: React maskiert alles, Zeilenumbrüche bleiben über CSS erhalten.
const Legal = ({ field }) => {
  const { t, i18n } = useTranslation();
  const { settings } = useSettings();
  const text = localized(settings[field], i18n.language);

  return (
    <main className="fx-page">
      <div className="fx-wrap-narrow">
        <header className="fx-page-head">
          <span className="fx-tag">{t("pages.legalTag")}</span>
          <h1 className="fx-h1">{t(`legal.${field}`)}</h1>
        </header>
        {text
          ? <p className="page-text">{text}</p>
          : <div className="fx-empty"><p className="fx-h3 mb-0">{t("legal.notAvailable")}</p></div>}
      </div>
    </main>
  );
};

export default Legal;
