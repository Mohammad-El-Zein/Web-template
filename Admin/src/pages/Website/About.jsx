import React from 'react';
import { useTranslation } from 'react-i18next';
import TranslateBar from '../../components/common/TranslateBar';
import { useWebsite } from './WebsiteContext';
import { LangField, WebsiteLangTabs } from './WebsiteFields';
import { LIMITS, MAX_ABOUT_IMAGES } from './settingsForm';
import PhotoList from './PhotoList';

const About = () => {
  const { t } = useTranslation();
  const { draft, change, translate, translating } = useWebsite();

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('website.about.title')}</h1>
          <p>{t('website.about.subtitle')}</p>
        </div>
      </div>

      <div className="form-grid">
        <section className="card-x">
          <div className="card-x-header"><h2>{t('website.about.textTitle')}</h2></div>
          <div className="card-x-body">
            <WebsiteLangTabs texts={[draft.aboutTitle, draft.aboutText]} />
            <LangField id="about-title" label={t('website.about.heading')} path="aboutTitle" maxLength={LIMITS.short}
              texts={draft.aboutTitle} onChange={(lang, value) => change((d) => { d.aboutTitle[lang] = value; })} />
            <LangField id="about-text" label={t('website.about.text')} path="aboutText" maxLength={LIMITS.long} rows={10}
              texts={draft.aboutText} onChange={(lang, value) => change((d) => { d.aboutText[lang] = value; })} />
            <TranslateBar busy={translating === 'about'}
              onTranslate={() => translate('about', [['aboutTitle'], ['aboutText']])} />
          </div>
        </section>

        <section className="card-x">
          <div className="card-x-header">
            <h2>{t('website.about.photos')}</h2>
            <span className="badge-x neutral no-dot">{draft.aboutImages.length} / {MAX_ABOUT_IMAGES}</span>
          </div>
          <div className="card-x-body">
            <PhotoList />
          </div>
        </section>
      </div>
    </>
  );
};

export default About;
