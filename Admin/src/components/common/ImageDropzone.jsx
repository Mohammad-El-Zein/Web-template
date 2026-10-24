import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { ALLOWED_IMAGE_TYPES, prepareImage } from '../../utils/imageResize';
import { apiErrorMessage } from '../../utils/apiErrors';

// Bild auswählen oder hineinziehen; wird vor der Übergabe verkleinert und komprimiert.
// file = neu gewähltes Bild, currentUrl = bereits gespeichertes Bild, onRemove optional,
// className z. B. "contain" (Logo, nicht beschneiden) oder "compact" (kleiner)
const ImageDropzone = ({ file, currentUrl, onChange, onRemove, className = '' }) => {
  const { t } = useTranslation();
  const fileInput = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState('');

  // Vorschau-URL wieder freigeben
  useEffect(() => {
    if (!file) {
      setPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pickImage = async (picked) => {
    if (!picked || processing) return;
    setProcessing(true);
    try {
      onChange(await prepareImage(picked));
    } catch (error) {
      toast.error(apiErrorMessage(error, t));
    } finally {
      setProcessing(false);
      // gleiche Datei erneut auswählbar machen
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    pickImage(event.dataTransfer.files[0]);
  };

  const shown = preview || currentUrl;
  const openPicker = () => !processing && fileInput.current?.click();

  return (
    <>
      <div
        className={`dropzone ${className} ${dragging ? 'dragging' : ''} ${shown && !processing ? 'has-image' : ''}`}
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
        ) : shown ? (
          <>
            <img src={shown} alt="" />
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
      <input ref={fileInput} type="file" accept={ALLOWED_IMAGE_TYPES.join(',')} hidden
        onChange={(e) => pickImage(e.target.files[0])} />
      {onRemove && shown && !processing && (
        <button type="button" className="link-btn mt-3" onClick={onRemove}>
          <i className="bi bi-x-circle"></i> {t('image.remove')}
        </button>
      )}
    </>
  );
};

export default ImageDropzone;
