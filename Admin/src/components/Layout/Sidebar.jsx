import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import brandLogo from '../../assets/brand-logo.png';
import { WEBSITE_URL } from '../../constants';

const Sidebar = ({ open, onNavigate }) => {
  const { t } = useTranslation();

  const link = (to, icon, label, end = false) => (
    <NavLink to={to} end={end} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onNavigate}>
      <i className={`bi ${icon}`}></i>
      <span>{label}</span>
    </NavLink>
  );

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`} aria-label={t('nav.menu')}>
      <NavLink to="/" className="sidebar-brand" onClick={onNavigate}>
        <img src={brandLogo} alt="" />
        <span className="sidebar-brand-text">
          <strong>FlavorHaus</strong>
          <span>Admin</span>
        </span>
      </NavLink>

      <nav className="sidebar-nav">
        <div className="sidebar-section">{t('nav.main')}</div>
        {link('/', 'bi-grid-1x2', t('nav.dashboard'), true)}
        {link('/orders', 'bi-receipt', t('nav.orders'))}

        <div className="sidebar-section">{t('nav.manage')}</div>
        {link('/foods', 'bi-egg-fried', t('nav.foods'), true)}
        {link('/foods/new', 'bi-plus-circle', t('nav.addFood'))}
        {link('/profile', 'bi-person-circle', t('nav.profile'))}
      </nav>

      <div className="sidebar-footer">
        <a href={WEBSITE_URL} target="_blank" rel="noreferrer" className="sidebar-link">
          <i className="bi bi-box-arrow-up-right"></i>
          <span>{t('nav.website')}</span>
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
