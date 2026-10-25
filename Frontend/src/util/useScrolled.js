import { useEffect, useState } from "react";

// true, sobald die Seite um mehr als `offset` Pixel gescrollt ist (für die Navigationsleiste)
export const useScrolled = (offset = 40) => {
  const [scrolled, setScrolled] = useState(() => window.scrollY > offset);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > offset);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [offset]);

  return scrolled;
};
