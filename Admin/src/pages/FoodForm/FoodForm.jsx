import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { addFood, getFood, translateText, updateFood } from '../../services/foodService';
import { getCategories } from '../../services/categoryService';
import { LANGUAGES, localizedText } from '../../i18n';
import { apiErrorField, apiErrorMessage } from '../../utils/apiErrors';
import LangTabs from '../../components/common/LangTabs';
import TranslateBar from '../../components/common/TranslateBar';
import ImageDropzone from '../../components/common/ImageDropzone';

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

  const [activeLang, setActiveLang] = useState('de');
  const [name, setName] = useState(emptyTexts());
  const [description, setDescription] = useState(emptyTexts());
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  // Alter Kategorie-Text, falls das Gericht noch keiner Kategorie zugeordnet ist
  const [legacyCategory, setLegacyCategory] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    const loadCategories = getCategories().catch(() => {
      toast.error(t('categories.loadError'));
      return [];
    });
    Promise.all([loadCategories, isEdit ? getFood(id) : null])
      .then(([categoryList, food]) => {
        setCategories(categoryList);
        if (!food) {
          // Neues Gericht: erste aktive Kategorie vorauswählen
          setCategoryId((categoryList.find((c) => c.active) || categoryList[0])?.id || '');
          return;
        }
        setName(toTexts(food.name));
        setDescription(toTexts(food.description));
        setPrice(food.price ?? '');
        setImageUrl(food.imageUrl || '');
        if (categoryList.some((c) => c.id === food.categoryId)) {
          setCategoryId(food.categoryId);
        } else {
          setCategoryId('');
          setLegacyCategory(food.category || '');
        }
      })
      .catch(() => {
        toast.error(t('form.loadError'));
        navigate('/foods');
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate, t]);

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
    if (!categoryId) {
      toast.error(t('form.categoryRequired'));
      return;
    }
    if (!isEdit && !image) {
      toast.error(t('form.imageRequired'));
      return;
    }
    setSaving(true);
    // Bild ist bereits verkleinert (ImageDropzone) und geht wie bisher mit dem Gericht an /api/foods
    const foodData = { name, description, categoryId, price: Number(price) };
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
      toast.error(apiErrorMessage(error, t));
      // Kategorie wurde inzwischen gelöscht -> neu auswählen lassen
      if (apiErrorField(error) === 'categoryId') setCategoryId('');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-block"><span className="spinner-border" role="status"></span></div>;
  }

  const current = LANGUAGES.find((l) => l.code === activeLang);
  const fieldDir = current.dir || 'ltr';
  const filled = Object.fromEntries(LANGUAGES.map((l) => [l.code, !!name[l.code].trim()]));

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
            <LangTabs active={activeLang} onChange={setActiveLang} filled={filled} />

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

            <TranslateBar onTranslate={translateFromGerman} busy={translating} />
          </div>
        </section>

        <div className="d-flex flex-column gap-3">
          <section className="card-x">
            <div className="card-x-header"><h2>{t('form.imageTitle')}</h2></div>
            <div className="card-x-body">
              <ImageDropzone file={image} currentUrl={imageUrl} onChange={setImage} />
            </div>
          </section>

          <section className="card-x">
            <div className="card-x-header"><h2>{t('form.detailsCard')}</h2></div>
            <div className="card-x-body">
              <div className="mb-3">
                <label htmlFor="food-category" className="form-label">{t('form.category')} <span className="required-mark">*</span></label>
                <select id="food-category" className="form-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                  disabled={categories.length === 0}>
                  {!categoryId && <option value="" disabled>{t('form.chooseCategory')}</option>}
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {localizedText(c.name)}{c.active ? '' : ` (${t('categories.inactive')})`}
                    </option>
                  ))}
                </select>
                {categories.length === 0 ? (
                  <p className="form-hint">
                    {t('form.noCategories')}{' '}
                    <Link to="/categories/new" className="link-btn">{t('form.createCategory')}</Link>
                  </p>
                ) : !categoryId && legacyCategory ? (
                  <p className="form-hint">{t('form.legacyCategory', { name: legacyCategory })}</p>
                ) : null}
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
        <button type="submit" className="btn btn-primary px-4" disabled={saving || categories.length === 0}>
          {saving && <span className="spinner-border spinner-inline" aria-hidden="true"></span>}
          {saving ? t('form.saving') : t('common.save')}
        </button>
      </div>
    </form>
  );
};

export default FoodForm;
