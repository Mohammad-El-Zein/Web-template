import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { addReview, getReviews, updateReview } from '../../services/reviewService';
import { translateText } from '../../services/foodService';
import { uploadImage } from '../../services/imageService';
import { LANGUAGES } from '../../i18n';
import { apiErrorField, apiErrorMessage } from '../../utils/apiErrors';
import LangTabs from '../../components/common/LangTabs';
import TranslateBar from '../../components/common/TranslateBar';
import ImageDropzone from '../../components/common/ImageDropzone';
import Switch from '../../components/common/Switch';
import RealReviewsNotice from '../../components/common/RealReviewsNotice';
import { StarPicker } from '../../components/common/Stars';

const emptyTexts = () => ({ de: '', en: '', ar: '' });
// Gleiche Grenzen wie im Backend (ReviewServiceImpl)
const MAX_AUTHOR = 100;
const MAX_TEXT = 1000;
const MAX_SOURCE = 50;
// Ausgangssprache fürs Übersetzen, wenn der aktive Reiter leer ist
const SOURCE_PRIORITY = ['de', 'en', 'ar'];

// Heutiges Datum als YYYY-MM-DD (lokale Zeit), Obergrenze für das Datumsfeld
const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const ReviewForm = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [activeLang, setActiveLang] = useState('de');
  const [authorName, setAuthorName] = useState('');
  const [text, setText] = useState(emptyTexts());
  const [rating, setRating] = useState(5);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photo, setPhoto] = useState(null);
  const [source, setSource] = useState('');
  const [date, setDate] = useState('');
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);

  // Es gibt keinen Einzel-Endpunkt, daher aus der Liste suchen
  useEffect(() => {
    if (!isEdit) return;
    getReviews()
      .then((list) => {
        const review = list.find((r) => r.id === id);
        if (!review) throw new Error('not found');
        setAuthorName(review.authorName || '');
        setText({ ...emptyTexts(), ...review.text });
        setRating(review.rating || 5);
        setPhotoUrl(review.photoUrl || '');
        setSource(review.source || '');
        setDate(review.date || '');
        setVisible(review.visible);
      })
      .catch(() => {
        toast.error(t('reviewForm.loadError'));
        navigate('/reviews');
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate, t]);

  const filledLangs = SOURCE_PRIORITY.filter((lang) => text[lang].trim());
  // Ausgangssprache: aktiver Reiter, wenn ausgefüllt, sonst die erste ausgefüllte (de, en, ar)
  const sourceLang = text[activeLang].trim() ? activeLang : filledLangs[0];

  // Aus der ausgefüllten Sprache übersetzen; nur leere Sprachen füllen
  const translateFromFilled = async () => {
    const from = sourceLang;
    if (!from) {
      toast.info(t('reviewForm.needText'));
      return;
    }
    if (filledLangs.length === SOURCE_PRIORITY.length) {
      toast.info(t('website.nothingToTranslate'));
      return;
    }
    setTranslating(true);
    try {
      const result = await translateText(text[from].trim(), from);
      setText((current) => Object.fromEntries(SOURCE_PRIORITY.map((lang) => [lang, current[lang] || result[lang] || ''])));
      toast.success(t('reviewForm.translated', { language: t(`languages.${from}`) }));
    } catch {
      toast.error(t('form.translateError'));
    } finally {
      setTranslating(false);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoUrl('');
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!authorName.trim()) {
      toast.error(t('errors.REVIEW_INVALID_authorName'));
      return;
    }
    if (filledLangs.length === 0) {
      toast.error(t('errors.REVIEW_INVALID_text'));
      return;
    }
    setSaving(true);
    try {
      let url = photoUrl;
      if (photo) {
        url = await uploadImage(photo, 'reviews');
        // Bei einem Fehler danach nicht noch einmal hochladen
        setPhotoUrl(url);
        setPhoto(null);
      }
      const review = { authorName, text, rating, photoUrl: url, source, date, visible };
      if (isEdit) {
        await updateReview(id, review);
        toast.success(t('reviewForm.updated'));
      } else {
        await addReview(review);
        toast.success(t('reviewForm.added'));
      }
      navigate('/reviews');
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
  const filled = Object.fromEntries(LANGUAGES.map((l) => [l.code, !!text[l.code].trim()]));

  return (
    <form onSubmit={onSubmit}>
      <div className="page-header">
        <div>
          <h1>{isEdit ? t('reviewForm.editTitle') : t('reviewForm.addTitle')}</h1>
          <p>{t('reviewForm.subtitle')}</p>
        </div>
      </div>

      <RealReviewsNotice />

      <div className="form-grid">
        <section className="card-x">
          <div className="card-x-header"><h2>{t('reviewForm.reviewTitle')}</h2></div>
          <div className="card-x-body">
            <div className="mb-3">
              <label htmlFor="review-author" className="form-label">
                {t('reviewForm.author')} <span className="required-mark">*</span>
              </label>
              <input id="review-author" type="text" className="form-control" maxLength={MAX_AUTHOR}
                placeholder={t('reviewForm.authorPlaceholder')} value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
            </div>

            <div className="mb-3">
              <span className="form-label d-block">{t('reviewForm.rating')} <span className="required-mark">*</span></span>
              <StarPicker id="review-rating" value={rating} onChange={setRating} />
            </div>

            <LangTabs active={activeLang} onChange={setActiveLang} filled={filled} />
            <div>
              <label htmlFor="review-text" className="form-label">
                {t('reviewForm.text')} ({t(`languages.${activeLang}`)})
              </label>
              <textarea id="review-text" rows={6} className="form-control" dir={current.dir || 'ltr'} lang={activeLang}
                maxLength={MAX_TEXT} placeholder={t('reviewForm.textPlaceholder')}
                value={text[activeLang]} onChange={(e) => setText({ ...text, [activeLang]: e.target.value })} />
            </div>

            <TranslateBar onTranslate={translateFromFilled} busy={translating} hint={t('reviewForm.textHint')}
              label={sourceLang ? t('reviewForm.translateFrom', { language: t(`languages.${sourceLang}`) }) : t('reviewForm.translate')} />
          </div>
        </section>

        <div className="d-flex flex-column gap-3">
          <section className="card-x">
            <div className="card-x-header"><h2>{t('reviewForm.photoTitle')}</h2></div>
            <div className="card-x-body">
              <ImageDropzone file={photo} currentUrl={photoUrl} onChange={setPhoto} onRemove={removePhoto} className="compact" />
              <p className="form-hint">{t('reviewForm.photoHint')}</p>
            </div>
          </section>

          <section className="card-x">
            <div className="card-x-header"><h2>{t('reviewForm.detailsTitle')}</h2></div>
            <div className="card-x-body">
              <div className="mb-3">
                <label htmlFor="review-source" className="form-label">
                  {t('reviewForm.source')} <span className="text-muted">· {t('common.optional')}</span>
                </label>
                <input id="review-source" type="text" className="form-control" maxLength={MAX_SOURCE}
                  placeholder={t('reviewForm.sourcePlaceholder')} value={source} onChange={(e) => setSource(e.target.value)} />
              </div>
              <div className="mb-3">
                <label htmlFor="review-date" className="form-label">
                  {t('reviewForm.date')} <span className="text-muted">· {t('common.optional')}</span>
                </label>
                <input id="review-date" type="date" className="form-control" max={today()}
                  value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="d-flex align-items-center justify-content-between gap-3">
                <label htmlFor="review-visible" className="form-label mb-0">{t('reviewForm.visible')}</label>
                <Switch id="review-visible" checked={visible} onChange={setVisible} label={t('reviewForm.visible')} />
              </div>
              <p className="form-hint">{t('reviewForm.visibleHint')}</p>
            </div>
          </section>
        </div>
      </div>

      <div className="form-actions">
        <Link to="/reviews" className="btn btn-light">{t('common.cancel')}</Link>
        <button type="submit" className="btn btn-primary px-4" disabled={saving}>
          {saving && <span className="spinner-border spinner-inline" aria-hidden="true"></span>}
          {saving ? t('form.saving') : t('common.save')}
        </button>
      </div>
    </form>
  );
};

export default ReviewForm;
