import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { addFood, getFood, translateText, updateFood } from '../../services/foodService';
import { LANGUAGES } from '../../i18n';
import { CATEGORIES, MAX_IMAGE_SIZE } from '../../constants';

const emptyTexts = () => ({ de: '', en: '', ar: '' });

const toTexts = (value) => {
  const texts = emptyTexts();
  if (typeof value === 'string') texts.de = value;
  else if (value) Object.keys(texts).forEach((lang) => { texts[lang] = value[lang] || ''; });
  return texts;
};

const FoodForm = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const fileInput = useRef(null);

  const [activeLang, setActiveLang] = useState('de');
  const [name, setName] = useState(emptyTexts());
  const [description, setDescription] = useState(emptyTexts());
  const [category, setCategory] = useState('Pizza');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    getFood(id)
      .then((food) => {
        setName(toTexts(food.name));
        setDescription(toTexts(food.description));
        setCategory(food.category || 'Pizza');
        setPrice(food.price ?? '');
        setImagePreview(food.imageUrl || '');
      })
      .catch(() => {
        toast.error(t('form.loadError'));
        navigate('/foods');
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate, t]);

  // Vorschau-URL wieder freigeben
  useEffect(() => {
    if (!image) return undefined;
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const pickImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t('form.invalidImage'));
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(t('form.imageTooLarge'));
      return;
    }
    setImage(file);
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    pickImage(event.dataTransfer.files[0]);
  };

  const translateFromGerman = async () => {
    if (!name.de.trim() || !description.de.trim()) {
      toast.info(t('form.needGerman'));
      setActiveLang('de');
      return;
    }
    setTranslating(true);
    try {
      const [names, descriptions] = await Promise.all([translateText(name.de), translateText(description.de)]);
      // Nur leere Felder füllen, eigene Texte bleiben erhalten
      setName((n) => ({ ...n, en: n.en || names.en || '', ar: n.ar || names.ar || '' }));
      setDescription((d) => ({ ...d, en: d.en || descriptions.en || '', ar: d.ar || descriptions.ar || '' }));
      toast.success(t('form.translated'));
    } catch {
      toast.error(t('form.translateError'));
    } finally {
      setTranslating(false);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!name.de.trim()) {
      toast.error(t('form.germanRequired'));
      setActiveLang('de');
      return;
    }
    if (!isEdit && !image) {
      toast.error(t('form.imageRequired'));
      return;
    }
    setSaving(true);
    const foodData = { name, description, category, price: Number(price) };
    try {
      if (isEdit) {
        await updateFood(id, foodData, image);
        toast.success(t('form.updated'));
      } else {
        await addFood(foodData, image);
        toast.success(t('form.added'));
      }
      navigate('/foods');
    } catch (error) {
      const status = error.response?.status;
      if (status === 413) toast.error(t('form.imageTooLarge'));
      else if (status === 400) toast.error(t('form.invalidImage'));
      else toast.error(status ? t('form.saveError', { code: status }) : t('form.noResponse'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-block"><span className="spinner-border" role="status"></span></div>;
  }

  const current = LANGUAGES.find((l) => l.code === activeLang);
  const fieldDir = current.dir || 'ltr';

  return (
    <form onSubmit={onSubmit}>
      <div className="page-header">
        <div>
          <h1>{isEdit ? t('form.editTitle') : t('form.addTitle')}</h1>
          <p>{t('form.addSubtitle')}</p>
        </div>
      </div>

      <div className="form-grid">
        <section className="card-x">
          <div className="card-x-header"><h2>{t('form.detailsTitle')}</h2></div>
          <div className="card-x-body">
            <div className="lang-tabs" role="tablist">
              {LANGUAGES.map((lang) => (
                <button key={lang.code} type="button" role="tab" aria-selected={activeLang === lang.code}
                  className={`lang-tab ${activeLang === lang.code ? 'active' : ''}`} onClick={() => setActiveLang(lang.code)}>
                  <img src={lang.flag} alt="" />
                  <span>{t(`languages.${lang.code}`)}</span>
                  <span className={`dot ${name[lang.code].trim() ? 'filled' : ''}`} aria-hidden="true"></span>
                </button>
              ))}
            </div>

            <div className="mb-3">
              <label htmlFor="food-name" className="form-label">
                {t('form.name')} ({t(`languages.${activeLang}`)}){' '}
                {activeLang === 'de' ? <span className="required-mark">*</span> : <span className="text-muted">· {t('common.optional')}</span>}
              </label>
              <input id="food-name" type="text" className="form-control" dir={fieldDir} lang={activeLang}
                placeholder={t('form.namePlaceholder')} maxLength={100}
                value={name[activeLang]} onChange={(e) => setName({ ...name, [activeLang]: e.target.value })} />
            </div>
            <div>
              <label htmlFor="food-description" className="form-label">
                {t('form.description')} ({t(`languages.${activeLang}`)})
              </label>
              <textarea id="food-description" className="form-control" rows={6} dir={fieldDir} lang={activeLang}
                placeholder={t('form.descriptionPlaceholder')} maxLength={1000}
                value={description[activeLang]} onChange={(e) => setDescription({ ...description, [activeLang]: e.target.value })} />
            </div>

            <div className="translate-bar">
              <p><i className="bi bi-info-circle"></i> {t('form.autoTranslateHint')}</p>
              <button type="button" className="btn btn-soft" onClick={translateFromGerman} disabled={translating}>
                {translating
                  ? <span className="spinner-border spinner-inline" aria-hidden="true"></span>
                  : <i className="bi bi-stars"></i>}
                {translating ? t('form.translating') : t('form.translate')}
              </button>
            </div>
          </div>
        </section>

        <div className="d-flex flex-column gap-3">
          <section className="card-x">
            <div className="card-x-header"><h2>{t('form.imageTitle')}</h2></div>
            <div className="card-x-body">
              <div
                className={`dropzone ${dragging ? 'dragging' : ''} ${imagePreview ? 'has-image' : ''}`}
                role="button" tabIndex={0}
                onClick={() => fileInput.current?.click()}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInput.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="" />
                    <span className="dropzone-change"><i className="bi bi-camera"></i>{t('form.changeImage')}</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-cloud-arrow-up"></i>
                    <strong>{t('form.imageHint')}</strong>
                    <small>{t('form.imageFormats')}</small>
                  </>
                )}
              </div>
              <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => pickImage(e.target.files[0])} />
            </div>
          </section>

          <section className="card-x">
            <div className="card-x-header"><h2>{t('form.detailsCard')}</h2></div>
            <div className="card-x-body">
              <div className="mb-3">
                <label htmlFor="food-category" className="form-label">{t('form.category')}</label>
                <select id="food-category" className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{t(`categories.${c}`)}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="food-price" className="form-label">{t('form.price')} <span className="required-mark">*</span></label>
                <div className="price-input" dir="ltr">
                  <input id="food-price" type="number" min="0" step="0.01" required className="form-control" dir="ltr"
                    value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
                  <span>€</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="form-actions">
        <Link to="/foods" className="btn btn-light">{t('common.cancel')}</Link>
        <button type="submit" className="btn btn-primary px-4" disabled={saving}>
          {saving && <span className="spinner-border spinner-inline" aria-hidden="true"></span>}
          {saving ? t('form.saving') : t('common.save')}
        </button>
      </div>
    </form>
  );
};

export default FoodForm;
