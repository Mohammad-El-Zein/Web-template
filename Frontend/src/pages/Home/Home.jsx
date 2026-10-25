import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { StoreContext } from "../../context/StoreContext";
import { useCategories } from "../../context/categoriesContext";
import { localized } from "../../util/settings";
import { useRestaurant } from "../../util/useRestaurant";
import FannedCarousel from "../../components/FannedCarousel/FannedCarousel";
import AboutSlideshow from "../../components/AboutSlideshow/AboutSlideshow";
import HoursList from "../../components/HoursList/HoursList";
import ReviewsSlider from "../../components/ReviewsSlider/ReviewsSlider";
import FoodImage from "../../components/FoodImage/FoodImage";
import "./Home.css";

const POPULAR_COUNT = 8;

// Startseite: Foto oben, beliebte Gerichte, Kategorien, Über uns, Öffnungszeiten & Kontakt, Bewertungen.
// reviews = Bewertungen für ReviewsSlider; zurzeit leer (ausgeblendet), später aus dem Admin-Panel.
const Home = ({ reviews = [] }) => {
  const { t } = useTranslation();
  const { foodList } = useContext(StoreContext);
  const { categories } = useCategories();
  const r = useRestaurant();
  const { settings, lang } = r;
  const [heroFailed, setHeroFailed] = useState(false);
  const arrow = lang === "ar" ? "bi-arrow-left" : "bi-arrow-right";

  const heroTitle = localized(settings.heroTitle, lang) || r.name;
  const subtitle = localized(settings.heroSubtitle, lang);
  const heroImage = !heroFailed && settings.heroImageUrl;
  const { deliveryEnabled, pickupEnabled } = settings.ordering;
  const kicker = deliveryEnabled && pickupEnabled
    ? t("home.kickerBoth")
    : deliveryEnabled ? t("home.kickerDelivery") : pickupEnabled ? t("home.kickerPickup") : "";
  const features = (settings.features || []).filter((f) => localized(f?.title, lang) || localized(f?.text, lang));

  // Über uns: eigener Titel als Überschrift, sonst wird der erste Satz des Textes zur Überschrift
  const ownTitle = r.aboutTitle && r.aboutTitle.trim().toLowerCase() !== t("about.title").toLowerCase();
  const [firstSentence, ...moreSentences] = (r.aboutText || "").split(/(?<=[.!?؟])\s+/);
  const aboutLead = ownTitle ? r.aboutTitle : firstSentence || r.aboutTitle;
  const aboutRest = ownTitle ? r.aboutText : moreSentences.join(" ");
  const showAbout = r.aboutText || r.aboutImages.length > 0;

  const contactItems = [
    r.phoneHref && { key: "call", label: t("home.call"), value: r.contact.phone, href: `tel:${r.phoneHref}`, ltr: true },
    r.contact.email && { key: "write", label: t("home.write"), value: r.contact.email, href: `mailto:${r.contact.email}` },
    r.contact.address && { key: "route", label: r.mapsUrl ? t("home.route") : t("contactInfo.address"), value: r.contact.address, href: r.mapsUrl },
  ].filter(Boolean);

  return (
    <main className="fx-home">
      {/* ---------- Foto oben ---------- */}
      <section className="fx-hero">
        {heroImage && <img src={heroImage} alt="" className="fx-hero-img" onError={() => setHeroFailed(true)} />}
        <div className="fx-hero-shade" aria-hidden="true"></div>
        <div className="fx-wrap fx-hero-content">
          {kicker && <p className="fx-kicker">{kicker}</p>}
          <h1 className="fx-hero-title">{heroTitle}</h1>
          {r.slogan && <p className="fx-hero-lead">{r.slogan}</p>}
          <div className="fx-hero-actions">
            <Link to="/explore" className="fx-btn fx-btn-primary on-photo">{t("home.orderNow")}</Link>
            {categories.length > 0 && (
              <a href="#menu" className="fx-link fx-link-light">
                {t("home.seeMenu")} <i className={`bi ${arrow}`} aria-hidden="true"></i>
              </a>
            )}
          </div>
        </div>
        {r.hasHours && (
          <p className="fx-hero-hours">
            <span dir="ltr">{r.todaySlots ? `${t("home.today")} ${r.todaySlots}` : t("home.closedToday")}</span>
          </p>
        )}
      </section>

      {/* ---------- Vorteile aus den Einstellungen ---------- */}
      {features.length > 0 && (
        <section className="fx-features" aria-label={heroTitle}>
          <div className="fx-wrap fx-features-grid">
            {features.map((feature, i) => (
              <div className="fx-feature" key={i}>
                {feature.imageUrl && <FoodImage src={feature.imageUrl} alt="" className="fx-feature-img" />}
                <div>
                  <h3 className="fx-feature-title">{localized(feature.title, lang)}</h3>
                  <p className="fx-feature-text">{localized(feature.text, lang)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- Beliebte Gerichte ---------- */}
      {foodList.length > 0 && (
        <section className="fx-section fx-popular">
          <div className="fx-wrap fx-head">
            <div>
              <span className="fx-tag">{t("home.popularTag")}</span>
              <h2 className="fx-h2">{t("home.popularTitle")}</h2>
            </div>
            {subtitle && <p className="fx-note fx-popular-note">{subtitle}</p>}
          </div>
          <FannedCarousel foods={foodList.slice(0, POPULAR_COUNT)} />
        </section>
      )}

      {/* ---------- Kategorien ---------- */}
      {categories.length > 0 && (
        <section className="fx-section fx-categories" id="menu">
          <div className="fx-wrap">
            <div className="fx-head">
              <div>
                <span className="fx-tag">{t("home.categoriesTag")}</span>
                <h2 className="fx-h2">{t("home.categoriesTitle")}</h2>
              </div>
              <Link to="/explore" state={{ category: "All" }} className="fx-link">
                {t("home.fullMenu")} <i className={`bi ${arrow}`} aria-hidden="true"></i>
              </Link>
            </div>
            <div className="fx-tiles">
              {categories.map((category, i) => (
                <Link
                  key={category.id}
                  to="/explore"
                  state={{ category: category.id }}
                  className={`fx-tile ${i === 0 ? "is-feature" : ""}`}
                >
                  <span className="fx-tile-count">
                    {t("home.dishCount", { count: foodList.filter((f) => f.categoryId === category.id).length })}
                  </span>
                  {category.imageUrl && <FoodImage src={category.imageUrl} alt="" loading="lazy" />}
                  <span className="fx-tile-name">{localized(category.name, lang)}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Über uns ---------- */}
      {showAbout && (
        <section className={`fx-about ${r.aboutImages.length ? "" : "no-photo"}`}>
          {r.aboutImages.length > 0 && <AboutSlideshow images={r.aboutImages} alt={r.aboutTitle || r.name} className="fx-about-photo" />}
          <div className="fx-about-panel">
            <span className="fx-tag fx-tag-outline">{t("about.title")}</span>
            {aboutLead && <h2 className="fx-h2">{aboutLead}</h2>}
            {aboutRest && <p className="fx-pre">{aboutRest}</p>}
            <p className="fx-signature">— {t("home.team", { name: r.name })}</p>
            <Link to="/about" className="fx-link">
              {t("home.aboutMore")} <i className={`bi ${arrow}`} aria-hidden="true"></i>
            </Link>
          </div>
        </section>
      )}

      {/* ---------- Öffnungszeiten & Kontakt ---------- */}
      {(r.hasHours || contactItems.length > 0) && (
        <section className="fx-section fx-visit" id="visit">
          <div className="fx-wrap">
            {r.hasHours && (
              <div className="fx-visit-grid">
                <div>
                  <span className="fx-tag">{t("home.today")}</span>
                  <p className="fx-today" dir={r.todaySlots ? "ltr" : undefined}>
                    {r.todaySlots
                      ? r.todaySlots.split(", ").map((slot) => <span key={slot}>{slot}</span>)
                      : t("hours.closed")}
                  </p>
                  <p className={`fx-status ${r.isOpenNow ? "is-open" : ""}`}>
                    {r.isOpenNow ? t("home.openNow") : t("home.closedNow")}
                  </p>
                </div>
                <div>
                  <p className="fx-label fx-label-muted">{t("hours.title")}</p>
                  <HoursList days={r.days} />
                </div>
              </div>
            )}

            {contactItems.length > 0 && (
              <div className="fx-contact-row">
                {contactItems.map((item) => {
                  const content = (
                    <>
                      <span className="fx-label">{item.label}</span>
                      <strong className="fx-pre" dir={item.ltr ? "ltr" : undefined}>{item.value}</strong>
                    </>
                  );
                  return item.href
                    ? <a key={item.key} href={item.href} {...(item.key === "route" ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{content}</a>
                    : <div key={item.key}>{content}</div>;
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ---------- Bewertungen (ohne Einträge ausgeblendet) ---------- */}
      <ReviewsSlider reviews={reviews} />
    </main>
  );
};

export default Home;
