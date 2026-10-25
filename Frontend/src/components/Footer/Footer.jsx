import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { localized } from "../../util/settings";
import { useRestaurant } from "../../util/useRestaurant";
import { SITE_CREDIT } from "../../config";
import SocialLinks from "../SocialLinks/SocialLinks";
import "./Footer.css";

// Footer auf allen Seiten: Name + Slogan + Social Media, heute geöffnet, Kontakt, Links; leere Angaben fallen weg
const Footer = () => {
  const { t } = useTranslation();
  const { settings, lang, name, slogan, todaySlots, hasHours, contact, phoneHref, hasAbout } = useRestaurant();
  const footerText = localized(settings.footerText, lang);
  const hasContact = contact.address || phoneHref || contact.email;

  return (
    <footer className="fx-footer">
      <div className="fx-wrap fx-footer-grid">
        <div className="fx-footer-brand">
          <p className="fx-footer-name">{name}</p>
          {slogan && <p className="fx-footer-text">{slogan}</p>}
          <SocialLinks links={contact.socialLinks} className="fx-social" />
        </div>

        {hasHours && (
          <div>
            <p className="fx-label">{t("footer.todayOpen")}</p>
            <p className="fx-footer-today" dir="ltr">{todaySlots || t("hours.closed")}</p>
            <Link to="/contact" className="fx-footer-link">{t("footer.allHours")}</Link>
          </div>
        )}

        {hasContact && (
          <div>
            <p className="fx-label">{t("footer.contact")}</p>
            {contact.address && <p className="fx-pre fx-footer-address">{contact.address}</p>}
            {phoneHref && <a href={`tel:${phoneHref}`} className="fx-footer-link" dir="ltr">{contact.phone}</a>}
            {contact.email && <a href={`mailto:${contact.email}`} className="fx-footer-link">{contact.email}</a>}
          </div>
        )}

        <nav aria-label={t("footer.links")}>
          <p className="fx-label">{t("footer.links")}</p>
          <Link to="/explore" className="fx-footer-link">{t("navbar.menu")}</Link>
          {hasAbout && <Link to="/about" className="fx-footer-link">{t("navbar.about")}</Link>}
          <Link to="/contact" className="fx-footer-link">{t("navbar.contact")}</Link>
          <Link to="/impressum" className="fx-footer-link">{t("legal.imprint")}</Link>
          <Link to="/datenschutz" className="fx-footer-link">{t("legal.privacyPolicy")}</Link>
        </nav>
      </div>

      <div className="fx-wrap fx-footer-bottom">
        <span>{footerText || `© ${new Date().getFullYear()} ${name}. ${t("footer.rights")}`}</span>
        {/* Name in src/config.js (SITE_CREDIT); ohne Namen keine Zeile */}
        {SITE_CREDIT.name && (
          <span className="site-credit">
            {t("footer.websiteBy")}{" "}
            {SITE_CREDIT.url
              ? <a href={SITE_CREDIT.url} target="_blank" rel="noopener noreferrer">{SITE_CREDIT.name}</a>
              : SITE_CREDIT.name}
          </span>
        )}
      </div>
    </footer>
  );
};

export default Footer;
