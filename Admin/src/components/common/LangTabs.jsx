import React from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../i18n';

// Sprach-Reiter DE/EN/AR; filled = { de: true, ... } zeigt den grünen Punkt,
// muted = Sprachen, die blass angezeigt werden (z. B. auf der Website ausgeschaltet), mit mutedLabel als Tooltip
const LangTabs = ({ active, onChange, filled, muted = [], mutedLabel = '' }) => {
  const { t } = useTranslation();

  return (
    <div className="lang-tabs" role="tablist">
      {LANGUAGES.map((lang) => {
        const isMuted = muted.includes(lang.code);
        return (
          <button key={lang.code} type="button" role="tab" aria-selected={active === lang.code}
            className={`lang-tab ${active === lang.code ? 'active' : ''} ${isMuted ? 'muted' : ''}`}
            title={isMuted ? mutedLabel : undefined} onClick={() => onChange(lang.code)}>
            <img src={lang.flag} alt="" />
            <span>{t(`languages.${lang.code}`)}</span>
            <span className={`dot ${filled[lang.code] ? 'filled' : ''}`} aria-hidden="true"></span>
          </button>
        );
      })}
    </div>
  );
};

export default LangTabs;
