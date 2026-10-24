import React from 'react';
import { useTranslation } from 'react-i18next';
import TranslateBar from '../../components/common/TranslateBar';
import { useWebsite } from './WebsiteContext';
import { LangField, WebsiteLangTabs } from './WebsiteFields';
import { LIMITS } from './settingsForm';

// Ein Rechtstext mit eigener Karte; Übersetzung mit Hinweis, dass sie geprüft werden muss
const LegalCard = ({ id, title, label, field, rows, maxLength, placeholder, legal = true }) => {
  const { t } = useTranslation();
  const { draft, change, translate, translating } = useWebsite();

  return (
    <section className="card-x">
      <div className="card-x-header"><h2>{title}</h2></div>
      <div className="card-x-body">
        <WebsiteLangTabs texts={[draft[field]]} />
        <LangField id={id} label={label} path={field} rows={rows} maxLength={maxLength} placeholder={placeholder}
          texts={draft[field]} onChange={(lang, value) => change((d) => { d[field][lang] = value; })} />
        <TranslateBar busy={translating === field}
          onTranslate={() => translate(field, [[field]], legal ? 'website.translatedLegal' : 'form.translated')} />
        {legal && <p className="form-hint"><i className="bi bi-exclamation-circle"></i> {t('website.legalHint')}</p>}
      </div>
    </section>
  );
};

const Legal = () => {
  const { t } = useTranslation();

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('website.legal.title')}</h1>
          <p>{t('website.legal.subtitle')}</p>
        </div>
      </div>

      <div className="d-flex flex-column gap-3">
        <LegalCard id="legal-imprint" field="imprint" title={t('website.legal.imprint')} label={t('website.legal.imprint')}
          rows={14} maxLength={LIMITS.legal} />
        <LegalCard id="legal-privacy" field="privacyPolicy" title={t('website.legal.privacy')} label={t('website.legal.privacy')}
          rows={14} maxLength={LIMITS.legal} />
        <LegalCard id="legal-footer" field="footerText" title={t('website.legal.footer')} label={t('website.legal.footerText')}
          maxLength={LIMITS.short} placeholder={t('website.legal.footerPlaceholder')} legal={false} />
      </div>
    </>
  );
};

export default Legal;
