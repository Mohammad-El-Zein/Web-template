import React from 'react';
import { useTranslation } from 'react-i18next';

// Dauerhafter Hinweis auf der Liste und im Formular der Bewertungen
const RealReviewsNotice = () => {
  const { t } = useTranslation();
  return (
    <div className="notice-x" role="note">
      <i className="bi bi-exclamation-triangle"></i>
      <p>{t('reviews.realOnly')}</p>
    </div>
  );
};

export default RealReviewsNotice;
