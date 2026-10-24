import React from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../context/settingsContext";
import { localized } from "../../util/settings";
import FoodImage from "../../components/FoodImage/FoodImage";
import "../Contact/Contact.css";
import "./About.css";

// "Über uns" des Restaurants aus den Website-Einstellungen (Titel, Text, Bild)
const About = () => {
  const { t, i18n } = useTranslation();
  const { settings } = useSettings();
  const title = localized(settings.aboutTitle, i18n.language) || t("about.title");
  const text = localized(settings.aboutText, i18n.language);
  const image = settings.aboutImageUrl;

  return (
    <section className="contact-section">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="contact-form-wrapper">
              {text || image ? (
                <div className="row g-4 align-items-center">
                  {image && (
                    <div className="col-md-5">
                      <FoodImage src={image} alt={title} className="about-img" />
                    </div>
                  )}
                  <div className={image ? "col-md-7" : "col-12"}>
                    <h2 className="mb-3 contact-title">{title}</h2>
                    {text && <p className="page-text">{text}</p>}
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-center mb-4 contact-title">{title}</h2>
                  <p className="text-center text-muted mb-0">{t("about.empty")}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
