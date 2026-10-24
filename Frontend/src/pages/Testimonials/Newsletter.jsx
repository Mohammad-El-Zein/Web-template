import React from "react";
import "./Testimonials.css";

// Newsletter-Anmeldung. Wird zurzeit NICHT angezeigt: sie versprach 10 % Rabatt, hat aber nichts gespeichert.
// Erst wieder einbauen, wenn es eine echte Anmeldung (Backend) gibt; Texte kommen dann als Props.
const Newsletter = ({ title, subtitle, placeholder, buttonLabel, onSubmit }) => (
  <div className="newsletter container" id="newsletter">
    <h2>{title}</h2>
    {subtitle && <p>{subtitle}</p>}
    <form onSubmit={onSubmit}>
      <input type="email" className="email" placeholder={placeholder} required />
      <button type="submit" className="s-btn">
        {buttonLabel}
      </button>
    </form>
  </div>
);

export default Newsletter;
