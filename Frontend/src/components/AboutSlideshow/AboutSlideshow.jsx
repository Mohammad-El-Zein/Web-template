import React, { useEffect, useState } from "react";
import FoodImage from "../FoodImage/FoodImage";
import { useReducedMotion } from "../../util/useReducedMotion";
import "./AboutSlideshow.css";

const INTERVAL = 4000;

// Bilder für "Über uns": ab 2 Bildern alle 4 s eine weiche Überblendung (endlos), sonst ein normales Bild.
// Alle Bilder liegen im selben Rahmen übereinander, daher springt nichts. Geladen wird immer nur das nächste Bild.
const AboutSlideshow = ({ images = [], alt = "", className = "" }) => {
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState({});
  const [loaded, setLoaded] = useState({});
  // index = sichtbares Bild, prev = vorheriges (bleibt darunter stehen), reach = bis hierhin eingebunden
  const [state, setState] = useState({ index: 0, prev: -1, reach: 1 });

  const list = images.filter((src) => !failed[src]);
  const animate = list.length > 1 && !reduced;
  const index = list.length ? state.index % list.length : 0;
  const next = list.length ? (index + 1) % list.length : 0;
  const nextReady = !!loaded[list[next]];

  useEffect(() => {
    if (!animate || !nextReady) return undefined;
    let timer;
    const start = () => {
      clearTimeout(timer);
      // Im Hintergrund-Tab anhalten, beim Zurückkommen wieder 4 s warten
      if (document.visibilityState !== "visible") return;
      timer = setTimeout(() => {
        setState((s) => ({ index: next, prev: index, reach: Math.max(s.reach, next + 1) }));
      }, INTERVAL);
    };
    start();
    document.addEventListener("visibilitychange", start);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", start);
    };
  }, [animate, nextReady, index, next]);

  if (list.length === 0 && images.length === 0) return null;

  // Ein Bild oder reduzierte Bewegung: nur das erste Bild, ohne Animation
  if (!animate) {
    return (
      <div className={`about-slides ${className}`}>
        <FoodImage src={list[0] || images[0]} alt={alt} className="about-slide is-active" />
      </div>
    );
  }

  return (
    <div className={`about-slides ${className}`}>
      {list.map((src, i) => (i <= state.reach || i === next) && (
        <img
          key={src}
          src={src}
          alt={i === index ? alt : ""}
          aria-hidden={i !== index}
          className={`about-slide ${i === index ? "is-active" : ""} ${i === state.prev ? "is-prev" : ""}`}
          onLoad={() => setLoaded((l) => ({ ...l, [src]: true }))}
          onError={() => setFailed((f) => ({ ...f, [src]: true }))}
        />
      ))}
    </div>
  );
};

export default AboutSlideshow;
