import React, { useEffect } from "react";
import "./Contact.css";
import ScrollReveal from "scrollreveal";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../context/settingsContext";
import { WEEKDAYS } from "../../util/settings";
import { formatDaySlots, todayWeekday } from "../../util/openingHours";
import SocialLinks from "../../components/SocialLinks/SocialLinks";

const isWebLink = (url) => /^https?:\/\//i.test(url || "");

// Kontaktdaten und Öffnungszeiten aus den Website-Einstellungen; leere Angaben werden ausgeblendet
const ContactUs = () => {
  const { t } = useTranslation();
  const { settings, now } = useSettings();
  const contact = settings.contact || {};
  const hours = settings.openingHours;

  const phoneHref = (contact.phone || "").replace(/[^\d+]/g, "");
  const whatsappDigits = (contact.whatsapp || "").replace(/\D/g, "");
  const items = [
    contact.address && {
      icon: "bi-geo-alt", label: t("contactInfo.address"),
      content: <span className="contact-address">{contact.address}</span>,
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
    isWebLink(contact.googleMapsUrl) && {
      icon: "bi-map", label: t("contactInfo.map"),
      content: <a href={contact.googleMapsUrl} target="_blank" rel="noopener noreferrer">{t("contactInfo.openMaps")}</a>,
    },
  ].filter(Boolean);

  const hasSocial = Object.values(contact.socialLinks || {}).some(isWebLink);
  const hasHours = WEEKDAYS.some((day) => formatDaySlots(hours, day));
  const today = todayWeekday(hours, now);

  useEffect(() => {
    const sr = ScrollReveal({
      origin: "top",
      distance: "60px",
      duration: 1800,
      delay: 300,
    });

    sr.reveal(".contact-section .container", {
      origin: "left",
    });

    sr.reveal(".contact-section h2", {
      origin: "top",
    });
  }, []);

  return (
    <section className="contact-section">
      <div className="container">
        <div className="row g-4 justify-content-center">
          {(items.length > 0 || hasSocial) && (
            <div className="col-lg-6">
              <div className="contact-form-wrapper h-100">
                <h2 className="text-center mb-4 contact-title">
                  {t("contactPage.title")}
                </h2>

                <ul className="contact-info-list">
                  {items.map((item) => (
                    <li key={item.icon}>
                      <i className={`bi ${item.icon}`} aria-hidden="true"></i>
                      <div>
                        <span className="contact-info-label">{item.label}</span>
                        {item.content}
                      </div>
                    </li>
                  ))}
                </ul>

                <SocialLinks links={contact.socialLinks} className="contact-social" />
              </div>
            </div>
          )}

          {hasHours && (
            <div className="col-lg-6">
              <div className="contact-form-wrapper h-100">
                <h2 className="text-center mb-4 contact-title">
                  {t("hours.title")}
                </h2>

                <table className="hours-table">
                  <tbody>
                    {WEEKDAYS.map((day) => {
                      const slots = formatDaySlots(hours, day);
                      return (
                        <tr key={day} className={day === today ? "today" : ""}>
                          <th scope="row">
                            {t(`days.${day}`)}
                            {day === today && <span className="visually-hidden"> ({t("hours.today")})</span>}
                          </th>
                          <td>
                            {slots
                              // Jedes Zeitfenster bleibt in einer Zeile, umgebrochen wird nur dazwischen
                              ? slots.split(", ").map((slot, i, all) => (
                                <React.Fragment key={slot}>
                                  {i > 0 && " "}
                                  <span className="hours-slot" dir="ltr">{slot}{i < all.length - 1 ? "," : ""}</span>
                                </React.Fragment>
                              ))
                              : <span className="hours-closed">{t("hours.closed")}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {items.length === 0 && !hasSocial && !hasHours && (
            <div className="col-lg-8">
              <div className="contact-form-wrapper">
                <h2 className="text-center mb-4 contact-title">
                  {t("contactPage.title")}
                </h2>
                <p className="text-center text-muted mb-0">{t("contactInfo.empty")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ContactUs;
