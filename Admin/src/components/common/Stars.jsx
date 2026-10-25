import React from 'react';
import { useTranslation } from 'react-i18next';

// Anzeige 1–5 Sterne (Liste der Bewertungen)
export const Stars = ({ rating }) => {
  const { t } = useTranslation();
  return (
    <span className="stars-x" role="img" aria-label={t('reviews.starsLabel', { count: rating })}>
      {[1, 2, 3, 4, 5].map((n) => <i key={n} className={`bi ${n <= rating ? 'bi-star-fill' : 'bi-star'}`} aria-hidden="true"></i>)}
    </span>
  );
};

// Auswahl 1–5 Sterne als Radiogruppe (Pfeiltasten ändern die Auswahl, in RTL gespiegelt)
export const StarPicker = ({ id, value, onChange }) => {
  const { t, i18n } = useTranslation();

  const onKeyDown = (event) => {
    const forward = i18n.dir() === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const back = i18n.dir() === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    let next = null;
    if (event.key === forward || event.key === 'ArrowUp') next = Math.min(5, (value || 0) + 1);
    if (event.key === back || event.key === 'ArrowDown') next = Math.max(1, (value || 1) - 1);
    if (next === null) return;
    event.preventDefault();
    onChange(next);
    event.currentTarget.querySelector(`[data-star="${next}"]`)?.focus();
  };

  return (
    <div id={id} className="star-picker" role="radiogroup" aria-label={t('reviewForm.rating')} onKeyDown={onKeyDown}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" data-star={n} aria-checked={value === n}
          tabIndex={value === n || (!value && n === 1) ? 0 : -1}
          aria-label={t('reviews.starsLabel', { count: n })} title={t('reviews.starsLabel', { count: n })}
          className={n <= (value || 0) ? 'on' : ''} onClick={() => onChange(n)}>
          <i className={`bi ${n <= (value || 0) ? 'bi-star-fill' : 'bi-star'}`} aria-hidden="true"></i>
        </button>
      ))}
    </div>
  );
};
