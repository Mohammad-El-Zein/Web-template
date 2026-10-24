import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import ScrollReveal from "scrollreveal";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../context/settingsContext";
import { localized } from "../../util/settings";
import { SITE_CREDIT } from "../../config";
import SocialLinks from "../SocialLinks/SocialLinks";
import "./Footer.css";

// Footer auf allen Seiten: Name, Kontakt, Social Media, Rechtliches und footerText aus den Einstellungen
const Footer = () => {
  const { t, i18n } = useTranslation();
  const { settings } = useSettings();
  const contact = settings.contact || {};
  const footerText = localized(settings.footerText, i18n.language);
  const phoneHref = (contact.phone || "").replace(/[^\d+]/g, "");

  useEffect(() => {
    const sr = ScrollReveal({
      origin: "top",
      distance: "60px",
      duration: 1800,
      delay: 400,
    });

    sr.reveal(".footer .footer-box", {
      origin: "bottom",
      interval: 200,
    });
  }, []);

  return (
    <footer className="footer">
      <div className="footer-content container">
        <div className="footer-box">
          <h3>{settings.restaurantName}</h3>
          <SocialLinks links={contact.socialLinks} />
        </div>

        {(contact.address || phoneHref || contact.email) && (
          <div className="footer-box footer-list">
            {contact.address && <span className="footer-address">{contact.address}</span>}
            {phoneHref && <a href={`tel:${phoneHref}`} dir="ltr">{contact.phone}</a>}
            {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
          </div>
        )}

        <div className="footer-box footer-list">
          <Link to="/contact">{t("navbar.contact")}</Link>
          <Link to="/impressum">{t("legal.imprint")}</Link>
          <Link to="/datenschutz">{t("legal.privacyPolicy")}</Link>
        </div>
      </div>

      {footerText && <p className="copyright">{footerText}</p>}

      {/* Name in src/config.js (SITE_CREDIT); ohne Namen keine Zeile */}
      {SITE_CREDIT.name && (
        <p className="site-credit">
          {t("footer.websiteBy")}{" "}
          {SITE_CREDIT.url
            ? <a href={SITE_CREDIT.url} target="_blank" rel="noopener noreferrer">{SITE_CREDIT.name}</a>
            : SITE_CREDIT.name}
        </p>
      )}
    </footer>
  );
};

export default Footer;
