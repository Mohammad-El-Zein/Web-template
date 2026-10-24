import React, { useEffect } from "react";
import "./Testimonials.css";
import ScrollReveal from "scrollreveal";
import FoodImage from "../../components/FoodImage/FoodImage";

// Bewertungen. Wird zurzeit NICHT angezeigt: die bisherigen Bewertungen waren erfunden.
// Später kommen echte Bewertungen aus dem Admin-Panel: reviews = [{ name, text, rating (1–5), imageUrl }]
const Testimonials = ({ title, reviews = [] }) => {
  useEffect(() => {
    const sr = ScrollReveal({
      origin: "top",
      distance: "60px",
      duration: 1700,
      delay: 400,
    });

    sr.reveal(".testimonials .heading-container", {
      origin: "left",
    });
    sr.reveal(".testimonial-content .t-box", {
      origin: "bottom",
      interval: 200,
    });
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="testimonials" id="testimonials">
      {title && <h2 className="heading-container">{title}</h2>}

      <div className="testimonial-content container">
        {reviews.map((review, index) => (
          <div className="t-box" key={index}>
            <div className="stars">
              {Array.from({ length: Math.min(5, Math.max(0, review.rating || 0)) }, (_, i) => (
                <i key={i} className="bi-star-fill"></i>
              ))}
            </div>
            <p>{review.text}</p>
            <div className="profile">
              <FoodImage src={review.imageUrl} alt={review.name} />
              <div className="profile-data">
                <h3>{review.name}</h3>
                <span></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
