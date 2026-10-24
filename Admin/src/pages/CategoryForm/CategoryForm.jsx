import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { addCategory, getCategories, updateCategory } from '../../services/categoryService';
import { translateText } from '../../services/foodService';
import { uploadImage } from '../../services/imageService';
import { LANGUAGES } from '../../i18n';
import { apiErrorField, apiErrorMessage } from '../../utils/apiErrors';
import LangTabs from '../../components/common/LangTabs';
import TranslateBar from '../../components/common/TranslateBar';
import ImageDropzone from '../../components/common/ImageDropzone';
import Switch from '../../components/common/Switch';

const emptyTexts = () => ({ de: '', en: '', ar: '' });

const CategoryForm = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [activeLang, setActiveLang] = useState('de');
  const [name, setName] = useState(emptyTexts());
  const [imageUrl, setImageUrl] = useState('');
  const [image, setImage] = useState(null);
  const [active, setActive] = useState(true);
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);

  // Es gibt keinen Einzel-Endpunkt, daher aus der Liste suchen
  useEffect(() => {
    if (!isEdit) return;
    getCategories()
      .then((list) => {
        const category = list.find((c) => c.id === id);
        if (!category) throw new Error('not found');
        setName({ ...emptyTexts(), ...category.name });
        setImageUrl(category.imageUrl || '');
        setActive(category.active);
        setSlug(category.slug || '');
      })
      .catch(() => {
        toast.error(t('categoryForm.loadError'));
        navigate('/categories');
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate, t]);

  const translateFromGerman = async () => {
    if (!name.de.trim()) {
      toast.info(t('categoryForm.needGerman'));
      setActiveLang('de');
      return;
    }
    setTranslating(true);
    try {
      const names = await translateText(name.de);
      // Nur leere Felder füllen, eigene Texte bleiben erhalten
      setName((n) => ({ ...n, en: n.en || names.en || '', ar: n.ar || names.ar || '' }));
      toast.success(t('form.translated'));
    } catch {
      toast.error(t('form.translateError'));
    } finally {
      setTranslating(false);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImageUrl('');
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!name.de.trim()) {
      toast.error(t('form.germanRequired'));
      setActiveLang('de');
      return;
    }
    setSaving(true);
    try {
      let url = imageUrl;
      if (image) {
        url = await uploadImage(image, 'categories');
        // Bei einem Fehler danach nicht noch einmal hochladen
        setImageUrl(url);
        setImage(null);
      }
      const category = { name, imageUrl: url, active };
      if (isEdit) {
        await updateCategory(id, category);
        toast.success(t('categoryForm.updated'));
      } else {
        await addCategory(category);
        toast.success(t('categoryForm.added'));
      }
      navigate('/categories');
    } catch (error) {
      toast.error(apiErrorMessage(error, t));
      const lang = apiErrorField(error).split('.')[1];
      if (LANGUAGES.some((l) => l.code === lang)) setActiveLang(lang);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-block"><span className="spinner-border" role="status"></span></div>;
  }

  const current = LANGUAGES.find((l) => l.code === activeLang);
  const filled = Object.fromEntries(LANGUAGES.map((l) => [l.code, !!name[l.code].trim()]));

  return (
    <form onSubmit={onSubmit}>
      <div className="page-header">
        <div>
          <h1>{isEdit ? t('categoryForm.editTitle') : t('categoryForm.addTitle')}</h1>
          <p>{t('categoryForm.subtitle')}</p>
        </div>
      </div>

      <div className="form-grid">
        <section className="card-x">
          <div className="card-x-header"><h2>{t('categoryForm.nameTitle')}</h2></div>
          <div className="card-x-body">
            <LangTabs active={activeLang} onChange={setActiveLang} filled={filled} />

            <div>
              <label htmlFor="category-name" className="form-label">
                {t('categoryForm.name')} ({t(`languages.${activeLang}`)}){' '}
                {activeLang === 'de' ? <span className="required-mark">*</span> : <span className="text-muted">· {t('common.optional')}</span>}
              </label>
              <input id="category-name" type="text" className="form-control" dir={current.dir || 'ltr'} lang={activeLang}
                placeholder={t('categoryForm.namePlaceholder')} maxLength={100}
                value={name[activeLang]} onChange={(e) => setName({ ...name, [activeLang]: e.target.value })} />
            </div>

            <TranslateBar onTranslate={translateFromGerman} busy={translating} />
          </div>
        </section>

        <div className="d-flex flex-column gap-3">
          <section className="card-x">
            <div className="card-x-header"><h2>{t('categoryForm.imageTitle')}</h2></div>
            <div className="card-x-body">
              <ImageDropzone file={image} currentUrl={imageUrl} onChange={setImage} onRemove={removeImage} />
            </div>
          </section>

          <section className="card-x">
            <div className="card-x-header"><h2>{t('categoryForm.detailsTitle')}</h2></div>
            <div className="card-x-body">
              <div className="d-flex align-items-center justify-content-between gap-3">
                <label htmlFor="category-active" className="form-label mb-0">{t('categoryForm.active')}</label>
                <Switch id="category-active" checked={active} onChange={setActive} label={t('categoryForm.active')} />
              </div>
              <p className="form-hint">{t('categoryForm.activeHint')}</p>
              {isEdit && slug && (
                <div className="mt-3">
                  <span className="form-label d-block">{t('categoryForm.slug')}</span>
                  <span className="mono" dir="ltr">{slug}</span>
                  <p className="form-hint">{t('categoryForm.slugHint')}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <div className="form-actions">
        <Link to="/categories" className="btn btn-light">{t('common.cancel')}</Link>
        <button type="submit" className="btn btn-primary px-4" disabled={saving}>
          {saving && <span className="spinner-border spinner-inline" aria-hidden="true"></span>}
          {saving ? t('form.saving') : t('common.save')}
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;
