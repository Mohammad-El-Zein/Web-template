import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../common/LanguageSwitcher';
import UserMenu from '../common/UserMenu';

const Topbar = ({ title, onMenuClick }) => {
  const { t } = useTranslation();
  return (
    <header className="topbar">
      <button type="button" className="icon-btn" onClick={onMenuClick} aria-label={t('nav.menu')}>
        <i className="bi bi-list"></i>
      </button>
      <h1 className="topbar-title">{title}</h1>
      <div className="topbar-actions">
        <LanguageSwitcher />
        <UserMenu />
      </div>
    </header>
  );
};

export default Topbar;
