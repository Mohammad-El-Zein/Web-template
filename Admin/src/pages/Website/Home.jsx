import React from 'react';
import { useTranslation } from 'react-i18next';
import { localizedText } from '../../i18n';
import TranslateBar from '../../components/common/TranslateBar';
import { useWebsite } from './WebsiteContext';
import { FieldError, LangField, SiteImage, WebsiteLangTabs } from './WebsiteFields';
import { emptyFeature, LIMITS, MAX_FEATURES } from './settingsForm';

const Home = () => {
  const { t } = useTranslation();
  const { draft, change, setFile, translate, translating } = useWebsite();
  const features = draft.features;

  const moveFeature = (index, direction) => change((d) => {
    [d.features[index], d.features[index + direction]] = [d.features[index + direction], d.features[index]];
  });

  const removeFeature = (feature) => {
    setFile(`feature:${feature._key}`, null);
    change((d) => { d.features = d.features.filter((f) => f._key !== feature._key); });
  };

  const featurePaths = features.flatMap((_, index) => [['features', index, 'title'], ['features', index, 'text']]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('website.home.title')}</h1>
          <p>{t('website.home.subtitle')}</p>
        </div>
      </div>

      <div className="form-grid">
        <section className="card-x">
          <div className="card-x-header"><h2>{t('website.home.heroTitle')}</h2></div>
          <div className="card-x-body">
            <WebsiteLangTabs texts={[draft.heroTitle, draft.heroSubtitle]} />
            <LangField id="hero-title" label={t('website.home.heroHeading')} path="heroTitle" maxLength={LIMITS.short}
              texts={draft.heroTitle} onChange={(lang, value) => change((d) => { d.heroTitle[lang] = value; })} />
            <LangField id="hero-subtitle" label={t('website.home.heroSubtitle')} path="heroSubtitle" maxLength={LIMITS.short}
              rows={3} texts={draft.heroSubtitle} onChange={(lang, value) => change((d) => { d.heroSubtitle[lang] = value; })} />
            <TranslateBar busy={translating === 'hero'}
              onTranslate={() => translate('hero', [['heroTitle'], ['heroSubtitle']])} />
          </div>
        </section>

        <section className="card-x">
          <div className="card-x-header"><h2>{t('website.home.heroImage')}</h2></div>
          <div className="card-x-body">
            <SiteImage fileKey="heroImageUrl" path="heroImageUrl" url={draft.heroImageUrl}
              onUrlChange={(url) => change((d) => { d.heroImageUrl = url; })} />
          </div>
        </section>
      </div>

      <section className="card-x mt-3">
        <div className="card-x-header">
          <h2>{t('website.home.featuresTitle')}</h2>
          <span className="badge-x neutral no-dot">{features.length} / {MAX_FEATURES}</span>
        </div>
        <div className="card-x-body">
          <p className="form-hint mt-0 mb-3">{t('website.home.featuresHint', { max: MAX_FEATURES })}</p>
          <FieldError path="features" />

          {features.length > 0 && <WebsiteLangTabs texts={features.flatMap((f) => [f.title, f.text])} />}

          {features.length === 0 && <div className="empty-state"><i className="bi bi-stars"></i>{t('website.home.noFeatures')}</div>}

          {features.map((feature, index) => (
            <div key={feature._key} className="list-item-x">
              <div className="list-item-x-header">
                <h3>{t('website.home.feature', { number: index + 1 })}
                  {localizedText(feature.title) && <span className="text-muted fw-normal"> · {localizedText(feature.title)}</span>}
                </h3>
                <div className="actions">
                  <button type="button" className="action-btn" title={t('categories.moveUp')} aria-label={t('categories.moveUp')}
                    disabled={index === 0} onClick={() => moveFeature(index, -1)}>
                    <i className="bi bi-arrow-up"></i>
                  </button>
                  <button type="button" className="action-btn" title={t('categories.moveDown')} aria-label={t('categories.moveDown')}
                    disabled={index === features.length - 1} onClick={() => moveFeature(index, 1)}>
                    <i className="bi bi-arrow-down"></i>
                  </button>
                  <button type="button" className="action-btn danger" title={t('website.home.removeFeature')}
                    aria-label={t('website.home.removeFeature')} onClick={() => removeFeature(feature)}>
                    <i className="bi bi-trash3"></i>
                  </button>
                </div>
              </div>
              <FieldError path={`features[${index}]`} />

              <div className="list-item-x-grid">
                <div>
                  <LangField id={`feature-title-${feature._key}`} label={t('website.home.featureTitle')} path={`features[${index}].title`}
                    maxLength={LIMITS.short} texts={feature.title}
                    onChange={(lang, value) => change((d) => { d.features[index].title[lang] = value; })} />
                  <LangField id={`feature-text-${feature._key}`} label={t('website.home.featureText')} path={`features[${index}].text`}
                    maxLength={LIMITS.long} rows={3} texts={feature.text}
                    onChange={(lang, value) => change((d) => { d.features[index].text[lang] = value; })} />
                </div>
                <div>
                  <span className="form-label d-block">{t('website.imageOptional')}</span>
                  <SiteImage fileKey={`feature:${feature._key}`} path={`features[${index}].imageUrl`} className="compact"
                    url={feature.imageUrl} onUrlChange={(url) => change((d) => { d.features[index].imageUrl = url; })} />
                </div>
              </div>
            </div>
          ))}

          <div className="d-flex align-items-center gap-3 flex-wrap mt-3">
            <button type="button" className="btn btn-soft" disabled={features.length >= MAX_FEATURES}
              onClick={() => change((d) => { d.features.push(emptyFeature()); })}>
              <i className="bi bi-plus-lg"></i>{t('website.home.addFeature')}
            </button>
            {features.length >= MAX_FEATURES && <span className="form-hint m-0">{t('website.home.maxFeatures', { max: MAX_FEATURES })}</span>}
          </div>

          {features.length > 0 && (
            <TranslateBar busy={translating === 'features'} onTranslate={() => translate('features', featurePaths)} />
          )}
        </div>
      </section>
    </>
  );
};

export default Home;
