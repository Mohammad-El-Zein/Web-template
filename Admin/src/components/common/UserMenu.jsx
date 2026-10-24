import React, { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../context/AdminContext';
import Avatar from './Avatar';
import { useClickOutside } from './useClickOutside';
import { WEBSITE_URL } from '../../constants';

const UserMenu = () => {
  const { t } = useTranslation();
  const { profile, logout } = useAdmin();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close);

  const displayName = profile?.name || profile?.email || '';

  return (
    <div className="dropdown-x" ref={ref}>
      <button type="button" className={`dropdown-trigger ${open ? 'open' : ''}`} onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu" aria-expanded={open}>
        <Avatar name={profile?.name} email={profile?.email} />
        <span className="user-trigger-name">{displayName}</span>
        <i className="bi bi-chevron-down chevron"></i>
      </button>
      {open && (
        <div className="dropdown-menu-x" role="menu">
          <div className="menu-header">
            <strong>{displayName}</strong>
            <span>{profile?.email}</span>
          </div>
          <Link to="/profile" className="menu-item" role="menuitem" onClick={close}>
            <i className="bi bi-person"></i>{t('nav.profile')}
          </Link>
          <a href={WEBSITE_URL} target="_blank" rel="noreferrer" className="menu-item" role="menuitem" onClick={close}>
            <i className="bi bi-box-arrow-up-right"></i>{t('nav.website')}
          </a>
          <div className="menu-divider"></div>
          <button type="button" className="menu-item danger" role="menuitem" onClick={logout}>
            <i className="bi bi-box-arrow-right"></i>{t('nav.logout')}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
