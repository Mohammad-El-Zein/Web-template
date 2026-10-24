import React from "react";
import { useSettings } from "../../context/settingsContext";
import "./Logo.css";

// Logo aus den Einstellungen, sonst der Restaurantname als Text-Logo (Schrift wie die Überschriften)
const Logo = ({ className = "", width, height, onDark = false }) => {
  const { settings } = useSettings();

  if (settings.logoUrl) {
    return <img src={settings.logoUrl} alt={settings.restaurantName} className={className} width={width} height={height} />;
  }
  return (
    <span className={`text-logo ${onDark ? "on-primary" : ""} ${className}`}>
      {settings.restaurantName}
    </span>
  );
};

export default Logo;
