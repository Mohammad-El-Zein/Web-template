import React, { useContext, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, EffectCreative, Keyboard, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-creative";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { useCategories } from "../../context/categoriesContext";
import { useReducedMotion } from "../../util/useReducedMotion";
import FoodImage from "../FoodImage/FoodImage";
import "./FannedCarousel.css";

// Seitliche Karten: Versatz in %, nach unten in px, Drehung, Größe, Deckkraft
const FAN = { x: 80, y: 26, rotate: 4, scale: 0.86, opacity: 0.5 };
// Für die Endlos-Schleife braucht Swiper genug Karten; wenige Gerichte werden dafür wiederholt
const MIN_SLIDES = 6;
const pad = (n) => String(n).padStart(2, "0");

// Aufgefächertes Karussell: mittlere Karte groß und gerade, seitliche kleiner, leicht gedreht und abgedunkelt.
// Alle 5 s weiter (endlos), Pause bei Maus darüber oder Berührung; bei reduzierter Bewegung ohne Autoplay.
const FannedCarousel = ({ foods, autoplay = 5000 }) => {
  const { t, i18n } = useTranslation();
  const { quantities, increaseQty } = useContext(StoreContext);
  const { categoryName } = useCategories();
  const reduced = useReducedMotion();
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const [index, setIndex] = useState(0);
  const lang = i18n.language;
  const rtl = i18n.dir(lang) === "rtl";
  const count = foods.length;

  if (count === 0) return null;

  const slides = [];
  while (count > 1 && slides.length < Math.max(count, MIN_SLIDES)) slides.push(...foods);
  // In RTL laufen die Karten spiegelverkehrt
  const dir = rtl ? -1 : 1;
  const side = (sign) => ({
    translate: [`${sign * dir * FAN.x}%`, FAN.y, -1],
    rotate: [0, 0, sign * dir * FAN.rotate],
    scale: FAN.scale,
    opacity: FAN.opacity,
  });
  const play = autoplay && !reduced && count > 1;

  const add = (food, name) => {
    increaseQty(food.id);
    toast.success(`${t("messages.addedToCart")}: ${name}`, { autoClose: 2000 });
  };

  return (
    <div className="fx-carousel">
      <Swiper
        key={lang}
        dir={rtl ? "rtl" : "ltr"}
        modules={[EffectCreative, Navigation, Keyboard, A11y, Autoplay]}
        autoplay={play ? { delay: autoplay, disableOnInteraction: false, pauseOnMouseEnter: true } : false}
        onTouchStart={(swiper) => play && swiper.autoplay?.pause()}
        onTouchEnd={(swiper) => play && swiper.autoplay?.resume()}
        effect="creative"
        creativeEffect={{ limitProgress: 2, prev: side(-1), next: side(1) }}
        slidesPerView={1}
        centeredSlides
        loop={count > 1}
        allowTouchMove={count > 1}
        speed={650}
        grabCursor={count > 1}
        keyboard={{ enabled: true }}
        onBeforeInit={(swiper) => {
          swiper.params.navigation.prevEl = prevRef.current;
          swiper.params.navigation.nextEl = nextRef.current;
        }}
        navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
        onSlideChange={(swiper) => setIndex(swiper.realIndex % count)}
        className="fx-carousel-swiper"
      >
        {(count > 1 ? slides : foods).map((food, i) => {
          const name = food.name?.[lang] || "";
          const qty = quantities[food.id] || 0;
          return (
            <SwiperSlide key={`${food.id}-${i}`}>
              <article className="fx-dish">
                <Link to={`/food/${food.id}`} className="fx-dish-photo" tabIndex={-1} aria-hidden="true" draggable="false">
                  <FoodImage src={food.imageUrl} alt="" draggable="false" />
                  <span className="fx-dish-no">{pad((i % count) + 1)}</span>
                </Link>
                <div className="fx-dish-body">
                  {categoryName(food) && <p className="fx-dish-line">{categoryName(food)}</p>}
                  <h3 className="fx-dish-name">
                    <Link to={`/food/${food.id}`} draggable="false">{name}</Link>
                  </h3>
                  <div className="fx-dish-foot">
                    <span className="fx-price">{Number(food.price).toFixed(2)} €</span>
                    <button
                      type="button"
                      className="fx-dish-add"
                      aria-label={`${t("card.addToCart")}: ${name}`}
                      onClick={() => add(food, name)}
                    >
                      <i className="bi bi-plus-lg" aria-hidden="true"></i>
                      {qty > 0 && <span className="fx-dish-qty" title={t("home.inCart", { count: qty })}>{qty}</span>}
                    </button>
                  </div>
                </div>
              </article>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {count > 1 && (
        <div className="fx-carousel-controls">
          <button ref={prevRef} type="button" className="fx-round" aria-label={t("home.prevDish")}>
            <i className={`bi ${rtl ? "bi-arrow-right" : "bi-arrow-left"}`} aria-hidden="true"></i>
          </button>
          <span className="fx-counter-text" dir="ltr">
            <strong>{pad(index + 1)}</strong> / {pad(count)}
          </span>
          <button ref={nextRef} type="button" className="fx-round" aria-label={t("home.nextDish")}>
            <i className={`bi ${rtl ? "bi-arrow-left" : "bi-arrow-right"}`} aria-hidden="true"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default FannedCarousel;
