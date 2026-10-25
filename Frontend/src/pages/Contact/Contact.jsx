import React from "react";
import "./Contact.css";
import { useTranslation } from "react-i18next";
import { useRestaurant } from "../../util/useRestaurant";
import HoursList from "../../components/HoursList/HoursList";
import SocialLinks from "../../components/SocialLinks/SocialLinks";

const isWebLink = (url) => /^https?:\/\//i.test(url || "");

// Kontaktdaten und Öffnungszeiten aus den Website-Einstellungen; leere Angaben werden ausgeblendet
const ContactUs = () => {
  const { t } = useTranslation();
  const { contact, phoneHref, mapsUrl, days, hasHours, todaySlots, isOpenNow } = useRestaurant();

  const whatsappDigits = (contact.whatsapp || "").replace(/\D/g, "");
  const items = [
    contact.address && {
      icon: "bi-geo-alt", label: t("contactInfo.address"),
      content: <span className="fx-pre">{contact.address}</span>,
    },
    phoneHref && {
      icon: "bi-telephone", label: t("contactInfo.phone"),
      content: <a href={`tel:${phoneHref}`} dir="ltr">{contact.phone}</a>,
    },
    contact.email && {
      icon: "bi-envelope", label: t("contactInfo.email"),
      content: <a href={`mailto:${contact.email}`}>{contact.email}</a>,
    },
    whatsappDigits && {
      icon: "bi-whatsapp", label: t("contactInfo.whatsapp"),
      content: <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noopener noreferrer" dir="ltr">{contact.whatsapp}</a>,
    },
    mapsUrl && {
      icon: "bi-map", label: t("contactInfo.map"),
      content: <a href={mapsUrl} target="_blank" rel="noopener noreferrer">{t("contactInfo.openMaps")}</a>,
    },
  ].filter(Boolean);

  const hasSocial = Object.values(contact.socialLinks || {}).some(isWebLink);

  return (
    <main className="fx-page">
      <div className="fx-wrap">
        <header className="fx-page-head">
          <span className="fx-tag">{t("home.visitTag")}</span>
          <h1 className="fx-h1">{t("contactPage.title")}</h1>
        </header>

        {items.length === 0 && !hasSocial && !hasHours ? (
          <div className="fx-empty">
            <p className="fx-h3">{t("contactInfo.empty")}</p>
          </div>
        ) : (
          <div className="fx-contact">
            {(items.length > 0 || hasSocial) && (
              <section aria-label={t("contactPage.title")}>
                <ul className="fx-contact-list">
                  {items.map((item) => (
                    <li key={item.icon}>
                      <i className={`bi ${item.icon}`} aria-hidden="true"></i>
                      <div>
                        <span className="fx-label fx-label-muted">{item.label}</span>
                        {item.content}
                      </div>
                    </li>
                  ))}
                </ul>
                <SocialLinks links={contact.socialLinks} className="fx-contact-social" />
              </section>
            )}

            {hasHours && (
              <section className="fx-card fx-contact-hours" aria-label={t("hours.title")}>
                <span className="fx-tag">{t("home.today")}</span>
                <p className="fx-contact-today" dir={todaySlots ? "ltr" : undefined}>
                  {todaySlots
                    ? todaySlots.split(", ").map((slot) => <span key={slot}>{slot}</span>)
                    : t("hours.closed")}
                </p>
                <p className={`fx-status ${isOpenNow ? "is-open" : ""}`}>
                  {isOpenNow ? t("home.openNow") : t("home.closedNow")}
                </p>
                <p className="fx-label fx-label-muted fx-contact-hours-title">{t("hours.title")}</p>
                <HoursList days={days} />
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default ContactUs;
