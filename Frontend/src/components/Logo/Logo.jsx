import React from "react";
import { useSettings } from "../../context/settingsContext";
import "./Logo.css";

// Logo aus den Einstellungen, sonst der Restaurantname als Text-Logo (Serifenschrift, Farbe vom Umfeld)
const Logo = ({ className = "" }) => {
  const { settings } = useSettings();

  if (settings.logoUrl) {
    return <img src={settings.logoUrl} alt={settings.restaurantName} className={`fx-logo-img ${className}`} />;
  }
  return <span className={`fx-logo-text ${className}`}>{settings.restaurantName}</span>;
};

export default Logo;
