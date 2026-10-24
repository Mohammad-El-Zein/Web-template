import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "../../i18n";
import "./LanguageSwitcher.css";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  // Menü schließen bei Klick außerhalb oder Escape
  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const choose = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div className="lang-switcher" ref={ref}>
      <button
        type="button"
        className={`lang-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Language"
      >
        <img src={current.flag} alt="" className="lang-flag" />
        <span className="lang-code">{current.code.toUpperCase()}</span>
        <i className="bi bi-chevron-down lang-chevron"></i>
      </button>

      {open && (
        <ul className="lang-menu" role="listbox">
          {LANGUAGES.map((lang) => (
            <li key={lang.code}>
              <button
                type="button"
                role="option"
                aria-selected={lang.code === current.code}
                className={`lang-option ${lang.code === current.code ? "active" : ""}`}
                onClick={() => choose(lang.code)}
              >
                <img src={lang.flag} alt="" className="lang-flag" />
                <span className="lang-label" lang={lang.code}>{lang.label}</span>
                {lang.code === current.code && <i className="bi bi-check2 lang-check"></i>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageSwitcher;
