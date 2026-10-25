import React from "react";
import { useTranslation } from "react-i18next";
import { useRestaurant } from "../../util/useRestaurant";
import AboutSlideshow from "../../components/AboutSlideshow/AboutSlideshow";
import "./About.css";

// "Über uns" des Restaurants aus den Website-Einstellungen (Titel, Text, Bilder als Überblendung)
const About = () => {
  const { t } = useTranslation();
  const { name, aboutTitle, aboutText, aboutImages } = useRestaurant();
  const title = aboutTitle || t("about.title");
  const hasImages = aboutImages.length > 0;

  return (
    <main className="fx-page">
      <div className="fx-wrap">
        {aboutText || hasImages ? (
          <div className={`fx-about-page ${hasImages ? "" : "no-photo"}`}>
            {hasImages && <AboutSlideshow images={aboutImages} alt={title} className="fx-about-page-photo" />}
            <div>
              <header className="fx-page-head">
                <span className="fx-tag">{name}</span>
                <h1 className="fx-h1">{title}</h1>
              </header>
              {aboutText && <p className="page-text">{aboutText}</p>}
              <p className="fx-about-page-sign">— {t("home.team", { name })}</p>
            </div>
          </div>
        ) : (
          <>
            <header className="fx-page-head">
              <span className="fx-tag">{name}</span>
              <h1 className="fx-h1">{title}</h1>
            </header>
            <div className="fx-empty">
              <p className="fx-h3">{t("about.empty")}</p>
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default About;
