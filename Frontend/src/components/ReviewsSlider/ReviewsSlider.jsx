import React, { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, EffectFade, Keyboard, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import { useTranslation } from "react-i18next";
import { localized } from "../../util/settings";
import { useReducedMotion } from "../../util/useReducedMotion";
import "./ReviewsSlider.css";

const pad = (n) => String(n).padStart(2, "0");

const Stars = ({ rating }) => {
  const value = Math.min(5, Math.max(0, Math.round(rating || 0)));
  return (
    <span className="fx-stars" role="img" aria-label={`${value}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <i key={i} className={`bi ${i < value ? "bi-star-fill" : "bi-star"}`} aria-hidden="true"></i>
      ))}
    </span>
  );
};

// Initialen aus dem Namen, z. B. "Lena Krüger" -> "LK"
const initials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Foto der Person, sonst (oder wenn es nicht lädt) die Initialen
const Avatar = ({ name, photoUrl }) => {
  const [failed, setFailed] = useState(false);
  if (photoUrl && !failed) {
    return <img src={photoUrl} alt="" className="fx-quote-avatar" onError={() => setFailed(true)} />;
  }
  return <span className="fx-quote-avatar fx-quote-initials" aria-hidden="true">{initials(name)}</span>;
};

// Bewertungen: immer ein großes Zitat, Überblendung, alle 7 s weiter. Ohne Bewertungen wird nichts angezeigt.
// reviews aus GET /api/reviews: [{ authorName, rating (1–5), text ({ [lang]: ... } oder Text), photoUrl, source, date (YYYY-MM-DD) }]
const ReviewsSlider = ({ reviews = [] }) => {
  const { t, i18n } = useTranslation();
  const reduced = useReducedMotion();
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const [index, setIndex] = useState(0);
  const lang = i18n.language;
  const rtl = i18n.dir(lang) === "rtl";

  if (reviews.length === 0) return null;

  const month = (date) => {
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) return "";
    return new Intl.DateTimeFormat(lang === "ar" ? "ar-u-nu-latn" : lang, { month: "long", year: "numeric" }).format(value);
  };
  const several = reviews.length > 1;

  return (
    <section className="fx-section fx-reviews">
      <div className="fx-wrap fx-reviews-grid">
        <div className="fx-reviews-intro">
          <span className="fx-tag">{t("reviews.tag")}</span>
          <h2 className="fx-h2">{t("reviews.title")}</h2>
          {several && (
            <div className="fx-reviews-counter">
              <button ref={prevRef} type="button" className="fx-round" aria-label={t("reviews.prev")}>
                <i className={`bi ${rtl ? "bi-arrow-right" : "bi-arrow-left"}`} aria-hidden="true"></i>
              </button>
              <span className="fx-counter-text" dir="ltr"><strong>{pad(index + 1)}</strong> / {pad(reviews.length)}</span>
              <button ref={nextRef} type="button" className="fx-round" aria-label={t("reviews.next")}>
                <i className={`bi ${rtl ? "bi-arrow-left" : "bi-arrow-right"}`} aria-hidden="true"></i>
              </button>
            </div>
          )}
        </div>

        <Swiper
          key={lang}
          dir={rtl ? "rtl" : "ltr"}
          modules={[EffectFade, Autoplay, Navigation, Keyboard, A11y]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          loop={several}
          speed={700}
          autoHeight
          autoplay={several && !reduced ? { delay: 7000, disableOnInteraction: false, pauseOnMouseEnter: true } : false}
          keyboard={{ enabled: true }}
          onBeforeInit={(swiper) => {
            swiper.params.navigation.prevEl = prevRef.current;
            swiper.params.navigation.nextEl = nextRef.current;
          }}
          navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
          onSlideChange={(swiper) => setIndex(swiper.realIndex)}
          className="fx-reviews-swiper"
        >
          {reviews.map((review, i) => {
            const meta = [review.source && `${t("reviews.via")} ${review.source}`, review.date && month(review.date)].filter(Boolean).join(" · ");
            return (
              <SwiperSlide key={review.id || i}>
                <figure className="fx-quote">
                  <Stars rating={review.rating} />
                  <blockquote>{localized(review.text, lang)}</blockquote>
                  <figcaption>
                    <Avatar name={review.authorName} photoUrl={review.photoUrl} />
                    <span className="fx-quote-who">
                      <span className="fx-quote-name">{review.authorName}</span>
                      {meta && <span className="fx-quote-meta">{meta}</span>}
                    </span>
                  </figcaption>
                </figure>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  );
};

export default ReviewsSlider;
