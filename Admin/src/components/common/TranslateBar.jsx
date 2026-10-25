import React from 'react';
import { useTranslation } from 'react-i18next';

// Hinweis + Knopf "Aus Deutsch übersetzen"; label/hint optional (z. B. Bewertungen: aus der ausgefüllten Sprache)
const TranslateBar = ({ onTranslate, busy, label, hint }) => {
  const { t } = useTranslation();

  return (
    <div className="translate-bar">
      <p><i className="bi bi-info-circle"></i> {hint || t('form.autoTranslateHint')}</p>
      <button type="button" className="btn btn-soft" onClick={onTranslate} disabled={busy}>
        {busy
          ? <span className="spinner-border spinner-inline" aria-hidden="true"></span>
          : <i className="bi bi-stars"></i>}
        {busy ? t('form.translating') : label || t('form.translate')}
      </button>
    </div>
  );
};

export default TranslateBar;
