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

// Bewertungen: immer ein großes Zitat, Überblendung, alle 7 s weiter. Ohne Bewertungen wird nichts angezeigt.
// reviews = [{ name, rating (1–5), text ({ de, en, ar } oder Text), source, date (ISO), example }] – später aus dem Admin-Panel
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
          {reviews.map((review, i) => (
            <SwiperSlide key={`${review.name}-${i}`}>
              <figure className="fx-quote">
                <Stars rating={review.rating} />
                <blockquote>{localized(review.text, lang)}</blockquote>
                <figcaption>
                  <span className="fx-quote-name">{review.name}</span>
                  <span className="fx-quote-meta">
                    {[review.source && `${t("reviews.via")} ${review.source}`, review.date && month(review.date)].filter(Boolean).join(" · ")}
                  </span>
                  {review.example && <span className="fx-example">{t("reviews.example")}</span>}
                </figcaption>
              </figure>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default ReviewsSlider;
