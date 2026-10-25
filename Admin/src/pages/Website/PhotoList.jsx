import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { ALLOWED_IMAGE_TYPES, prepareImage } from '../../utils/imageResize';
import { apiErrorMessage } from '../../utils/apiErrors';
import { useWebsite } from './WebsiteContext';
import { FieldError } from './WebsiteFields';
import { MAX_ABOUT_IMAGES, newKey } from './settingsForm';

// Vorschau: neu gewähltes Bild (File) oder gespeicherte URL
const PhotoPreview = ({ file, url }) => {
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (!file) {
      setPreview('');
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return <img src={preview || url} alt="" />;
};

// Fotos für "Über uns": mehrere auswählen oder hineinziehen, sortieren, entfernen.
// Neue Fotos liegen bis zum Speichern als Datei in files ("about:<_key>") und werden dann in "site" hochgeladen.
const PhotoList = () => {
  const { t, i18n } = useTranslation();
  const { draft, change, files, setFile, hasError } = useWebsite();
  const fileInput = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const photos = draft.aboutImages;
  const full = photos.length >= MAX_ABOUT_IMAGES;
  const rtl = i18n.dir() === 'rtl';

  const addFiles = async (list) => {
    const picked = [...(list || [])];
    if (picked.length === 0 || processing) return;
    const free = MAX_ABOUT_IMAGES - photos.length;
    if (picked.length > free) toast.info(t('website.about.maxPhotos', { max: MAX_ABOUT_IMAGES }));
    const take = picked.slice(0, Math.max(0, free));
    if (take.length === 0) return;

    setProcessing(true);
    // Nacheinander verkleinern, damit große Handyfotos den Browser nicht überlasten
    for (const file of take) {
      try {
        const prepared = await prepareImage(file);
        const key = newKey();
        change((d) => { d.aboutImages.push({ _key: key, url: '' }); });
        setFile(`about:${key}`, prepared);
      } catch (error) {
        toast.error(`${file.name}: ${apiErrorMessage(error, t)}`);
      }
    }
    setProcessing(false);
    // gleiche Dateien erneut auswählbar machen
    if (fileInput.current) fileInput.current.value = '';
  };

  const move = (index, direction) => change((d) => {
    [d.aboutImages[index], d.aboutImages[index + direction]] = [d.aboutImages[index + direction], d.aboutImages[index]];
  });

  const remove = (photo) => {
    setFile(`about:${photo._key}`, null);
    change((d) => { d.aboutImages = d.aboutImages.filter((p) => p._key !== photo._key); });
  };

  const openPicker = () => !processing && !full && fileInput.current?.click();

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    if (!full) addFiles(event.dataTransfer.files);
  };

  return (
    <>
      <p className="form-hint mt-0 mb-3"><i className="bi bi-info-circle"></i> {t('website.about.photosHint')}</p>
      <FieldError path="aboutImages" />

      {photos.length > 0 && (
        <ul className="photo-grid">
          {photos.map((photo, index) => (
            <li key={photo._key} className={`photo-item ${hasError(`aboutImages[${index}]`) ? 'invalid' : ''}`}>
              <div className="photo-thumb">
                <PhotoPreview file={files[`about:${photo._key}`]} url={photo.url} />
                {index === 0 && <span className="photo-main"><i className="bi bi-star-fill"></i>{t('website.about.mainPhoto')}</span>}
                {!photo.url && <span className="photo-new">{t('website.about.newPhoto')}</span>}
              </div>
              <div className="photo-actions">
                <span className="photo-number">{index + 1}</span>
                <div className="actions">
                  {/* "Nach vorne" zeigt zum Anfang der Liste: in LTR nach links, in RTL nach rechts */}
                  <button type="button" className="action-btn" title={t('website.about.moveEarlier')} aria-label={t('website.about.moveEarlier')}
                    disabled={index === 0} onClick={() => move(index, -1)}>
                    <i className={`bi ${rtl ? 'bi-arrow-right' : 'bi-arrow-left'}`}></i>
                  </button>
                  <button type="button" className="action-btn" title={t('website.about.moveLater')} aria-label={t('website.about.moveLater')}
                    disabled={index === photos.length - 1} onClick={() => move(index, 1)}>
                    <i className={`bi ${rtl ? 'bi-arrow-left' : 'bi-arrow-right'}`}></i>
                  </button>
                  <button type="button" className="action-btn danger" title={t('website.about.removePhoto')} aria-label={t('website.about.removePhoto')}
                    onClick={() => remove(photo)}>
                    <i className="bi bi-trash3"></i>
                  </button>
                </div>
              </div>
              <FieldError path={`aboutImages[${index}]`} />
            </li>
          ))}
        </ul>
      )}

      {full ? (
        <p className="form-hint mb-0">{t('website.about.maxPhotos', { max: MAX_ABOUT_IMAGES })}</p>
      ) : (
        <div
          className={`dropzone photo-drop ${dragging ? 'dragging' : ''}`}
          role="button" tabIndex={0} aria-busy={processing}
          onClick={openPicker}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openPicker()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          {processing ? (
            <>
              <span className="spinner-border" aria-hidden="true"></span>
              <strong>{t('image.optimizing')}</strong>
            </>
          ) : (
            <>
              <i className="bi bi-images"></i>
              <strong>{t('website.about.addPhotos')}</strong>
              <small>{t('form.imageFormats')}</small>
            </>
          )}
        </div>
      )}
      <input ref={fileInput} type="file" multiple accept={ALLOWED_IMAGE_TYPES.join(',')} hidden
        onChange={(e) => addFiles(e.target.files)} />
    </>
  );
};

export default PhotoList;
