import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../i18n';
import { useClickOutside } from './useClickOutside';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close);

  const current = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  return (
    <div className="dropdown-x" ref={ref}>
      <button type="button" className={`dropdown-trigger ${open ? 'open' : ''}`} onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox" aria-expanded={open} aria-label={t('nav.language')}>
        <img src={current.flag} alt="" className="flag" />
        <span className="lang-trigger-code">{current.code.toUpperCase()}</span>
        <i className="bi bi-chevron-down chevron"></i>
      </button>
      {open && (
        <div className="dropdown-menu-x" role="listbox">
          {LANGUAGES.map((lang) => (
            <button key={lang.code} type="button" role="option" aria-selected={lang.code === current.code}
              className={`menu-item ${lang.code === current.code ? 'active' : ''}`}
              onClick={() => { i18n.changeLanguage(lang.code); close(); }}>
              <img src={lang.flag} alt="" className="flag" />
              <span className="grow" lang={lang.code}>{lang.label}</span>
              {lang.code === current.code && <i className="bi bi-check2"></i>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
