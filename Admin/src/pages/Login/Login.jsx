import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import brandLogo from '../../assets/brand-logo.png';
import { login } from '../../services/authService';
import { setToken } from '../../services/api';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

const Login = ({ onLogin }) => {
  const { t } = useTranslation();
  const [data, setData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData(data => ({ ...data, [name]: value }));
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await login(data.email, data.password);
      if (response.role !== 'ADMIN') {
        toast.error(t('login.noAdmin'));
        return;
      }
      setToken(response.token);
      onLogin();
    } catch {
      toast.error(t('login.wrong'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-brand">
        <img src={brandLogo} alt="FlavorHaus" />
        <h1>{t('login.brandTitle')}</h1>
        <p>{t('login.brandText')}</p>
      </section>

      <section className="login-form-side">
        <div className="login-form-top">
          <LanguageSwitcher />
        </div>
        <div className="login-form-wrap">
          <form className="login-form" onSubmit={onSubmitHandler}>
            <img src={brandLogo} alt="FlavorHaus" className="login-mobile-logo" />
            <h2>{t('login.title')}</h2>
            <p className="lead-text">{t('login.subtitle')}</p>

            <div className="mb-3">
              <label htmlFor="email" className="form-label">{t('login.email')}</label>
              <div className="input-icon">
                <i className="bi bi-envelope"></i>
                <input type="email" className="form-control" id="email" name="email" required autoComplete="username"
                  value={data.email} onChange={onChangeHandler} />
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="form-label">{t('login.password')}</label>
              <div className="input-icon">
                <i className="bi bi-lock"></i>
                <input type="password" className="form-control" id="password" name="password" required autoComplete="current-password"
                  value={data.password} onChange={onChangeHandler} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
              {loading && <span className="spinner-border spinner-inline" aria-hidden="true"></span>}
              {loading ? t('login.submitting') : t('login.submit')}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

export default Login;
