import React from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, localizedText } from '../../i18n';
import TranslateBar from '../../components/common/TranslateBar';
import { useWebsite } from './WebsiteContext';
import { FieldError, LangField, SiteImage, SwitchRow, WebsiteLangTabs } from './WebsiteFields';
import { HEX_COLOR, LANGS, LIMITS } from './settingsForm';

const ColorField = ({ id, label, value, onChange, path }) => {
  const { t } = useTranslation();
  const { hasError } = useWebsite();
  const valid = HEX_COLOR.test(value);

  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">{label}</label>
      <div className="color-field" dir="ltr">
        <input type="color" aria-label={label} value={valid ? value.toLowerCase() : '#000000'}
          onChange={(e) => onChange(e.target.value)} />
        <input id={id} type="text" className={`form-control mono ${!valid || hasError(path) ? 'invalid' : ''}`}
          maxLength={7} placeholder="#9a401c" value={value} onChange={(e) => onChange(e.target.value.trim())} />
      </div>
      {valid ? <FieldError path={path} /> : <p className="field-error">{t('website.errors.color')}</p>}
    </div>
  );
};

const General = () => {
  const { t } = useTranslation();
  const { draft, change, hasError, translate, translating } = useWebsite();

  // Vorschau nur mit gültigen Farben
  const primary = HEX_COLOR.test(draft.primaryColor) ? draft.primaryColor : 'var(--text-muted)';
  const accent = HEX_COLOR.test(draft.accentColor) ? draft.accentColor : 'var(--text-muted)';
  const enabled = draft.enabledLanguages;

  const toggleLanguage = (code, on) => change((d) => {
    d.enabledLanguages = on
      ? LANGS.filter((lang) => d.enabledLanguages.includes(lang) || lang === code)
      : d.enabledLanguages.filter((lang) => lang !== code);
    // Standardsprache muss eingeschaltet sein
    if (!d.enabledLanguages.includes(d.defaultLanguage)) d.defaultLanguage = d.enabledLanguages[0];
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('website.general.title')}</h1>
          <p>{t('website.general.subtitle')}</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="d-flex flex-column gap-3">
          <section className="card-x">
            <div className="card-x-header"><h2>{t('website.general.restaurantTitle')}</h2></div>
            <div className="card-x-body">
              <div className="mb-3">
                <label htmlFor="site-name" className="form-label">
                  {t('website.general.name')} <span className="required-mark">*</span>
                </label>
                <input id="site-name" type="text" className={`form-control ${hasError('restaurantName') ? 'invalid' : ''}`}
                  maxLength={LIMITS.name} value={draft.restaurantName}
                  onChange={(e) => change((d) => { d.restaurantName = e.target.value; })} />
                <FieldError path="restaurantName" />
              </div>

              <WebsiteLangTabs texts={[draft.slogan]} />
              <LangField id="site-slogan" label={t('website.general.slogan')} path="slogan" maxLength={LIMITS.short}
                texts={draft.slogan} onChange={(lang, value) => change((d) => { d.slogan[lang] = value; })} />
              <TranslateBar busy={translating === 'slogan'} onTranslate={() => translate('slogan', [['slogan']])} />
            </div>
          </section>

          <section className="card-x">
            <div className="card-x-header"><h2>{t('website.general.colorsTitle')}</h2></div>
            <div className="card-x-body">
              <div className="row g-3">
                <div className="col-sm-6">
                  <ColorField id="site-primary" label={t('website.general.primaryColor')} path="primaryColor"
                    value={draft.primaryColor} onChange={(value) => change((d) => { d.primaryColor = value; })} />
                </div>
                <div className="col-sm-6">
                  <ColorField id="site-accent" label={t('website.general.accentColor')} path="accentColor"
                    value={draft.accentColor} onChange={(value) => change((d) => { d.accentColor = value; })} />
                </div>
              </div>

              <span className="form-label d-block">{t('website.general.preview')}</span>
              {/* Nachbau der Website: Menüleiste in der Hauptfarbe, Link und Knopf in der Akzentfarbe */}
              <div className="color-preview" aria-hidden="true">
                <div className="color-preview-bar" style={{ background: primary }}>
                  <strong>{draft.restaurantName || t('website.general.name')}</strong>
                  <span className="color-preview-link" style={{ color: accent }}>{t('website.general.previewLink')}</span>
                </div>
                <div className="color-preview-body">
                  <h3 style={{ color: primary }}>{localizedText(draft.heroTitle) || t('website.general.previewHeading')}</h3>
                  <span className="color-preview-btn" style={{ background: accent }}>{t('website.general.previewButton')}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="d-flex flex-column gap-3">
          <section className="card-x">
            <div className="card-x-header"><h2>{t('website.general.logo')}</h2></div>
            <div className="card-x-body">
              <SiteImage fileKey="logoUrl" path="logoUrl" className="contain" url={draft.logoUrl}
                onUrlChange={(url) => change((d) => { d.logoUrl = url; })} />
            </div>
          </section>

          <section className="card-x">
            <div className="card-x-header"><h2>{t('website.general.favicon')}</h2></div>
            <div className="card-x-body">
              <SiteImage fileKey="faviconUrl" path="faviconUrl" className="contain compact" url={draft.faviconUrl}
                onUrlChange={(url) => change((d) => { d.faviconUrl = url; })} />
              <p className="form-hint">{t('website.general.faviconHint')}</p>
            </div>
          </section>

          <section className="card-x">
            <div className="card-x-header"><h2>{t('website.general.languagesTitle')}</h2></div>
            <div className="card-x-body">
              {LANGUAGES.map((lang) => {
                const on = enabled.includes(lang.code);
                return (
                  <SwitchRow key={lang.code} id={`site-lang-${lang.code}`} label={t(`languages.${lang.code}`)}
                    checked={on} disabled={on && enabled.length === 1} onChange={(value) => toggleLanguage(lang.code, value)} />
                );
              })}
              <p className="form-hint">{t('website.general.languagesHint')}</p>
              <FieldError path="enabledLanguages" />

              <div className="mt-3">
                <label htmlFor="site-default-lang" className="form-label">{t('website.general.defaultLanguage')}</label>
                <select id="site-default-lang" className={`form-select ${hasError('defaultLanguage') ? 'invalid' : ''}`}
                  value={draft.defaultLanguage} onChange={(e) => change((d) => { d.defaultLanguage = e.target.value; })}>
                  {LANGUAGES.filter((lang) => enabled.includes(lang.code)).map((lang) => (
                    <option key={lang.code} value={lang.code}>{t(`languages.${lang.code}`)}</option>
                  ))}
                </select>
                <FieldError path="defaultLanguage" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default General;
