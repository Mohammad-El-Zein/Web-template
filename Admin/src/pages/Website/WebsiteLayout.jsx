import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useBlocker, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { getSettings, saveSettings } from '../../services/settingsService';
import { uploadImage } from '../../services/imageService';
import { translateText } from '../../services/foodService';
import { apiErrorCode, apiErrorField, apiErrorMessage } from '../../utils/apiErrors';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { WebsiteContext } from './WebsiteContext';
import {
  fieldLocation, getIn, LANGS, normalize, settingsErrorText, toPayload, TRANSLATE_LIMIT, withImageUrl,
} from './settingsForm';

// Lädt die Einstellungen einmal und teilt sie mit allen Website-Seiten,
// damit ungespeicherte Änderungen beim Seitenwechsel erhalten bleiben
const WebsiteLayout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [original, setOriginal] = useState(null);
  const [draft, setDraft] = useState(null);
  // Neu gewählte, noch nicht hochgeladene Bilder: { logoUrl: File, 'feature:k3': File, ... }
  const [files, setFiles] = useState({});
  const [error, setError] = useState(null);
  const [activeLang, setActiveLang] = useState('de');
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setLoadFailed(false);
    getSettings()
      .then((settings) => {
        const normalized = normalize(settings);
        setOriginal(normalized);
        setDraft(normalized);
      })
      .catch(() => setLoadFailed(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(() => !!draft && (Object.keys(files).length > 0
    || JSON.stringify(toPayload(draft)) !== JSON.stringify(toPayload(original))), [draft, original, files]);

  // Tab schließen oder neu laden
  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  // Navigation aus dem Website-Bereich heraus (Seitenleiste, Zurück-Knopf)
  const blocker = useBlocker(useCallback(
    ({ nextLocation }) => dirty && !nextLocation.pathname.startsWith('/website'),
    [dirty]
  ));

  // Änderung auf einer Kopie, z. B. change((d) => { d.restaurantName = 'x'; })
  const change = useCallback((mutate) => {
    setDraft((current) => {
      const next = structuredClone(current);
      mutate(next);
      return next;
    });
    setError(null);
  }, []);

  const setFile = useCallback((key, file) => {
    setFiles((current) => {
      const { [key]: _old, ...rest } = current;
      return file ? { ...rest, [key]: file } : rest;
    });
    setError(null);
  }, []);

  const showError = useCallback((field, text) => {
    setError({ field, text });
    toast.error(text);
    const location = fieldLocation(field);
    if (location.lang) setActiveLang(location.lang);
    navigate(`/website/${location.page}`);
  }, [navigate]);

  const hasError = useCallback((path) => error?.field === path, [error]);

  // Füllt nur leere Sprachen; paths z. B. [['heroTitle'], ['features', 0, 'title']]
  const translate = useCallback(async (id, paths, successKey = 'form.translated') => {
    const jobs = paths.map((path) => ({ path, texts: getIn(draft, path) }))
      .filter((job) => job.texts?.de?.trim());
    if (jobs.length === 0) {
      toast.info(t('website.needGerman'));
      setActiveLang('de');
      return;
    }
    const missing = jobs.filter((job) => LANGS.some((lang) => lang !== 'de' && !job.texts[lang]?.trim()));
    if (missing.length === 0) {
      toast.info(t('website.nothingToTranslate'));
      return;
    }
    const run = missing.filter((job) => job.texts.de.length <= TRANSLATE_LIMIT);
    if (run.length < missing.length) toast.info(t('website.translateTooLong', { max: TRANSLATE_LIMIT }));
    if (run.length === 0) return;

    setTranslating(id);
    try {
      const results = await Promise.all(run.map((job) => translateText(job.texts.de.trim())));
      change((d) => {
        run.forEach((job, index) => {
          const target = getIn(d, job.path);
          LANGS.forEach((lang) => {
            if (lang !== 'de' && !target[lang]?.trim() && results[index]?.[lang]) target[lang] = results[index][lang];
          });
        });
      });
      toast.success(t(successKey));
    } catch {
      toast.error(t('form.translateError'));
    } finally {
      setTranslating('');
    }
  }, [draft, change, t]);

  const save = async () => {
    const names = draft.contact.socialLinks.map((link) => link.name.trim()).filter(Boolean);
    if (new Set(names).size !== names.length) {
      showError('contact.socialLinks', t('website.contact.duplicateSocial'));
      return;
    }
    setSaving(true);
    let next = draft;
    try {
      // Bilder zuerst hochladen; jede URL sofort übernehmen, damit ein zweiter Versuch nicht erneut hochlädt
      for (const [key, file] of Object.entries(files)) {
        const url = await uploadImage(file, 'site');
        next = withImageUrl(next, key, url);
        setDraft(next);
        setFile(key, null);
      }
      const saved = normalize(await saveSettings(toPayload(next)));
      setOriginal(saved);
      setDraft(saved);
      setFiles({});
      setError(null);
      toast.success(t('website.saved'));
    } catch (err) {
      if (apiErrorCode(err) === 'SETTINGS_INVALID' && apiErrorField(err)) {
        const field = apiErrorField(err);
        showError(field, settingsErrorText(t, field, err.response.data.message));
      } else {
        toast.error(apiErrorMessage(err, t));
      }
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setDraft(original);
    setFiles({});
    setError(null);
    setConfirmDiscard(false);
  };

  const closeDiscard = useCallback(() => setConfirmDiscard(false), []);
  const stay = useCallback(() => blocker.reset?.(), [blocker]);
  const leave = useCallback(() => blocker.proceed?.(), [blocker]);

  const value = useMemo(() => ({
    draft, change, files, setFile, error, hasError, activeLang, setActiveLang, translate, translating,
  }), [draft, change, files, setFile, error, hasError, activeLang, translate, translating]);

  if (loading) {
    return <div className="loading-block"><span className="spinner-border" role="status"></span></div>;
  }
  if (loadFailed) {
    return (
      <section className="card-x">
        <div className="empty-state">
          <i className="bi bi-cloud-slash"></i>
          <p>{t('website.loadError')}</p>
          <button type="button" className="btn btn-soft" onClick={load}><i className="bi bi-arrow-clockwise"></i>{t('website.retry')}</button>
        </div>
      </section>
    );
  }

  return (
    <WebsiteContext.Provider value={value}>
      <Outlet />

      {dirty && (
        <div className="save-bar" role="region" aria-label={t('website.unsaved')}>
          <span className="save-bar-text"><i className="bi bi-exclamation-circle"></i>{t('website.unsaved')}</span>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-light" onClick={() => setConfirmDiscard(true)} disabled={saving}>
              {t('website.discard')}
            </button>
            <button type="button" className="btn btn-primary px-4" onClick={save} disabled={saving}>
              {saving && <span className="spinner-border spinner-inline" aria-hidden="true"></span>}
              {saving ? t('form.saving') : t('common.save')}
            </button>
          </div>
        </div>
      )}

      {confirmDiscard && (
        <ConfirmDialog icon="bi-arrow-counterclockwise" title={t('website.discardTitle')} text={t('website.discardText')}
          confirmLabel={t('website.discard')} onConfirm={discard} onCancel={closeDiscard} />
      )}
      {blocker.state === 'blocked' && (
        <ConfirmDialog icon="bi-exclamation-triangle" title={t('website.leaveTitle')} text={t('website.leaveText')}
          confirmLabel={t('website.leave')} onConfirm={leave} onCancel={stay} />
      )}
    </WebsiteContext.Provider>
  );
};

export default WebsiteLayout;
