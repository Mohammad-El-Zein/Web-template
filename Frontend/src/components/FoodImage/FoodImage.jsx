import React, { useState } from "react";
import placeholder from "../../assets/placeholder.svg";

// Bild aus der API (imageUrl); fehlt es oder lädt es nicht, ein neutraler Platzhalter
const FoodImage = ({ src, alt = "", className, ...props }) => {
  const [failedSrc, setFailedSrc] = useState("");
  const usable = src && src !== failedSrc;

  return (
    <img
      {...props}
      src={usable ? src : placeholder}
      alt={alt}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
};

export default FoodImage;
