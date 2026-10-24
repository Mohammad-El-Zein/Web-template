import React from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../i18n';

// Sprach-Reiter DE/EN/AR; filled = { de: true, ... } zeigt den grünen Punkt
const LangTabs = ({ active, onChange, filled }) => {
  const { t } = useTranslation();

  return (
    <div className="lang-tabs" role="tablist">
      {LANGUAGES.map((lang) => (
        <button key={lang.code} type="button" role="tab" aria-selected={active === lang.code}
          className={`lang-tab ${active === lang.code ? 'active' : ''}`} onClick={() => onChange(lang.code)}>
          <img src={lang.flag} alt="" />
          <span>{t(`languages.${lang.code}`)}</span>
          <span className={`dot ${filled[lang.code] ? 'filled' : ''}`} aria-hidden="true"></span>
        </button>
      ))}
    </div>
  );
};

export default LangTabs;
