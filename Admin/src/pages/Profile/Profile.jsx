import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAdmin } from '../../context/AdminContext';
import { changePassword, updateProfile } from '../../services/authService';
import { LANGUAGES } from '../../i18n';
import Avatar from '../../components/common/Avatar';

const MIN_PASSWORD_LENGTH = 6;

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { profile, setProfile } = useAdmin();
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setName(profile?.name || '');
  }, [profile]);

  if (!profile) {
    return <div className="loading-block"><span className="spinner-border" role="status"></span></div>;
  }

  const saveName = async (event) => {
    event.preventDefault();
    setSavingName(true);
    try {
      setProfile(await updateProfile(name));
      toast.success(t('profile.nameSaved'));
    } catch {
      toast.error(t('profile.nameError'));
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    if (passwords.next.length < MIN_PASSWORD_LENGTH) {
      toast.error(t('profile.tooShort'));
      return;
    }
    if (passwords.next !== passwords.confirm) {
      toast.error(t('profile.mismatch'));
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(passwords.current, passwords.next);
      setPasswords({ current: '', next: '', confirm: '' });
      toast.success(t('profile.passwordChanged'));
    } catch {
      toast.error(t('profile.wrongCurrent'));
    } finally {
      setSavingPassword(false);
    }
  };

  const setPassword = (field) => (e) => setPasswords({ ...passwords, [field]: e.target.value });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('profile.title')}</h1>
          <p>{t('profile.subtitle')}</p>
        </div>
      </div>

      <section className="card-x profile-hero">
        <Avatar name={profile.name} email={profile.email} size="xl" />
        <div>
          <h2>{profile.name || profile.email}</h2>
          <p><bdi>{profile.email}</bdi></p>
          <span className="badge-x brand no-dot"><i className="bi bi-shield-check"></i>{t(`profile.roles.${profile.role}`)}</span>
        </div>
      </section>

      <div className="profile-grid">
        <section className="card-x">
          <div className="card-x-header"><h2>{t('profile.personal')}</h2></div>
          <form className="card-x-body" onSubmit={saveName}>
            <div className="mb-3">
              <label htmlFor="profile-name" className="form-label">{t('profile.name')}</label>
              <input id="profile-name" className="form-control" value={name} maxLength={100} required
                onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="mb-3">
              <label htmlFor="profile-email" className="form-label">{t('profile.email')}</label>
              <input id="profile-email" className="form-control" value={profile.email} disabled dir="ltr" />
              <p className="form-hint">{t('profile.emailHint')}</p>
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingName || !name.trim() || name === profile.name}>
              {savingName && <span className="spinner-border spinner-inline" aria-hidden="true"></span>}
              {t('profile.saveName')}
            </button>
          </form>
        </section>

        <section className="card-x">
          <div className="card-x-header"><h2>{t('profile.security')}</h2></div>
          <form className="card-x-body" onSubmit={savePassword}>
            <div className="mb-3">
              <label htmlFor="pw-current" className="form-label">{t('profile.currentPassword')}</label>
              <input id="pw-current" type="password" className="form-control" required autoComplete="current-password"
                value={passwords.current} onChange={setPassword('current')} />
            </div>
            <div className="mb-3">
              <label htmlFor="pw-new" className="form-label">{t('profile.newPassword')}</label>
              <input id="pw-new" type="password" className="form-control" required autoComplete="new-password"
                value={passwords.next} onChange={setPassword('next')} />
              <p className="form-hint">{t('profile.passwordHint')}</p>
            </div>
            <div className="mb-3">
              <label htmlFor="pw-confirm" className="form-label">{t('profile.confirmPassword')}</label>
              <input id="pw-confirm" type="password" className="form-control" required autoComplete="new-password"
                value={passwords.confirm} onChange={setPassword('confirm')} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingPassword}>
              {savingPassword && <span className="spinner-border spinner-inline" aria-hidden="true"></span>}
              {t('profile.changePassword')}
            </button>
          </form>
        </section>

        <section className="card-x">
          <div className="card-x-header">
            <div>
              <h2>{t('profile.preferences')}</h2>
              <p className="sub">{t('profile.languageHint')}</p>
            </div>
          </div>
          <div className="card-x-body">
            <div className="lang-options">
              {LANGUAGES.map((lang) => (
                <button key={lang.code} type="button" className={`lang-option-card ${i18n.language === lang.code ? 'active' : ''}`}
                  onClick={() => i18n.changeLanguage(lang.code)} aria-pressed={i18n.language === lang.code}>
                  <img src={lang.flag} alt="" />
                  <span lang={lang.code}>{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Profile;
