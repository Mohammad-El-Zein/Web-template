import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";
import "./Header.css";
import ScrollReveal from "scrollreveal";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../context/settingsContext";
import { localized } from "../../util/settings";
import FoodImage from "../FoodImage/FoodImage";

// Inhalte aus den Website-Einstellungen; leere Teile werden ausgeblendet
const Header = () => {
  const { t, i18n } = useTranslation();
  const { settings } = useSettings();
  const lang = i18n.language;

  const title = localized(settings.heroTitle, lang) || settings.restaurantName;
  const slogan = localized(settings.slogan, lang);
  const subtitle = localized(settings.heroSubtitle, lang);
  const features = (settings.features || []).filter((f) => localized(f?.title, lang) || localized(f?.text, lang));

  useEffect(() => {
    const sr = ScrollReveal({
      origin: "top",
      distance: "60px",
      duration: 1700,
      delay: 400,
    });

    sr.reveal(".header-text", { origin: "left" });
    sr.reveal(".header-image", { origin: "right" });
    sr.reveal(".my-feature", { origin: "bottom", interval: 150 });
  }, []);

  return (
    <div className="Headerr">
      <div className="home-header">
        <div className={`container content-header ${settings.heroImageUrl ? "" : "no-image"}`}>
          <div className="header-text">
            <h1 className="f">{title}</h1>

            {slogan && <p className="a">{slogan}</p>}

            {subtitle && <h3>{subtitle}</h3>}

            <Link to="/explore" className="btn">
              {t("header.orderNow")}
            </Link>
          </div>

          {settings.heroImageUrl && (
            <div className="header-image">
              <FoodImage src={settings.heroImageUrl} alt={title} className="home-img" />
            </div>
          )}
        </div>

        <img src={assets.homemask} alt="" className="homemask-img" />
      </div>

      {features.length > 0 && (
        <div className="feature container my-feature">
          {features.map((feature, index) => (
            <div className="feature-box" key={index}>
              {feature.imageUrl && <FoodImage src={feature.imageUrl} alt="" className="feature-img" />}
              <div className="feature-text">
                <h4>{localized(feature.title, lang)}</h4>
                <p>{localized(feature.text, lang)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Header;
