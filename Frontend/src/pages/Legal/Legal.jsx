import React from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../context/settingsContext";
import { localized } from "../../util/settings";
import "../Contact/Contact.css";
import "../About/About.css";

// Impressum (field = "imprint") bzw. Datenschutz (field = "privacyPolicy") aus den Einstellungen.
// Reiner Text: React maskiert alles, Zeilenumbrüche bleiben über CSS erhalten.
const Legal = ({ field }) => {
  const { t, i18n } = useTranslation();
  const { settings } = useSettings();
  const text = localized(settings[field], i18n.language);

  return (
    <section className="contact-section">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="contact-form-wrapper">
              <h2 className="mb-4 contact-title">{t(`legal.${field}`)}</h2>
              {text
                ? <p className="page-text">{text}</p>
                : <p className="text-muted mb-0">{t("legal.notAvailable")}</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Legal;
