import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../i18n';
import LangTabs from '../../components/common/LangTabs';
import ImageDropzone from '../../components/common/ImageDropzone';
import Switch from '../../components/common/Switch';
import { useWebsite } from './WebsiteContext';
import { LANGS } from './settingsForm';

// Fehler vom Backend direkt am Feld; scrollt beim Erscheinen ins Bild
export const FieldError = ({ path }) => {
  const { error } = useWebsite();
  const ref = useRef(null);
  const show = !!error && error.field === path;

  useEffect(() => {
    if (show) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [show]);

  if (!show) return null;
  return <p ref={ref} className="field-error" role="alert">{error.text}</p>;
};

// Sprach-Reiter (eine gemeinsame Sprache für alle Website-Seiten), ausgeschaltete Sprachen blass
export const WebsiteLangTabs = ({ texts }) => {
  const { t } = useTranslation();
  const { draft, activeLang, setActiveLang } = useWebsite();
  const muted = LANGS.filter((lang) => !draft.enabledLanguages.includes(lang));
  const filled = Object.fromEntries(LANGS.map((lang) => [lang, texts.length > 0 && texts.every((map) => !!map[lang]?.trim())]));

  return (
    <>
      <LangTabs active={activeLang} onChange={setActiveLang} filled={filled} muted={muted} mutedLabel={t('website.notShownShort')} />
      {muted.includes(activeLang) && (
        <p className="form-hint lang-muted-hint">
          <i className="bi bi-eye-slash"></i> {t('website.notShown', { language: t(`languages.${activeLang}`) })}
        </p>
      )}
    </>
  );
};

// Mehrsprachiges Feld in der aktiven Sprache; path = Feld im Backend, z. B. "slogan" oder "features[0].title"
export const LangField = ({ id, label, texts, onChange, path, maxLength, rows, placeholder }) => {
  const { t } = useTranslation();
  const { activeLang, hasError } = useWebsite();
  const dir = LANGUAGES.find((l) => l.code === activeLang)?.dir || 'ltr';
  const fieldPath = `${path}.${activeLang}`;
  const props = {
    id, dir, lang: activeLang, maxLength, placeholder,
    className: `form-control ${hasError(fieldPath) ? 'invalid' : ''}`,
    value: texts[activeLang],
    onChange: (e) => onChange(activeLang, e.target.value),
  };

  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">{label} ({t(`languages.${activeLang}`)})</label>
      {rows ? <textarea rows={rows} {...props} /> : <input type="text" {...props} />}
      <FieldError path={fieldPath} />
    </div>
  );
};

// Bild der Website; wird erst beim Speichern hochgeladen (fileKey z. B. "logoUrl" oder "feature:k3")
export const SiteImage = ({ fileKey, url, onUrlChange, path, className }) => {
  const { files, setFile } = useWebsite();
  const remove = () => {
    setFile(fileKey, null);
    onUrlChange('');
  };

  return (
    <>
      <ImageDropzone file={files[fileKey] || null} currentUrl={url} className={className}
        onChange={(file) => setFile(fileKey, file)} onRemove={remove} />
      <FieldError path={path} />
    </>
  );
};

// Zeile mit Beschriftung, Hinweis und Schalter
export const SwitchRow = ({ id, label, hint, checked, onChange, disabled }) => (
  <div className="switch-row">
    <div>
      <label htmlFor={id} className="form-label mb-0">{label}</label>
      {hint && <p className="form-hint mb-0">{hint}</p>}
    </div>
    <Switch id={id} checked={checked} onChange={onChange} label={label} disabled={disabled} />
  </div>
);
