import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

// true, wenn im System "Bewegung reduzieren" eingeschaltet ist (ändert sich live mit)
export const useReducedMotion = () => {
  const [reduced, setReduced] = useState(() => window.matchMedia?.(QUERY).matches ?? false);

  useEffect(() => {
    const media = window.matchMedia?.(QUERY);
    if (!media) return undefined;
    const onChange = () => setReduced(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return reduced;
};
