import { ImageError } from './imageResize';

// Fehler in übersetzten Text umwandeln. Backend schickt { code, message, field, foodCount, ... }
// Feldspezifische Texte heißen z. B. errors.CATEGORY_INVALID_name_de (Punkte im Feld werden zu "_").
export const apiErrorMessage = (error, t) => {
  if (error instanceof ImageError) {
    return t(error.code === 'tooLarge' ? 'errors.IMAGE_TOO_LARGE' : 'errors.IMAGE_INVALID');
  }
  const response = error?.response;
  if (!response) return t('errors.noResponse');
  // z. B. Upload-Limit eines Proxys
  if (response.status === 413) return t('errors.IMAGE_TOO_LARGE');

  const data = response.data || {};
  if (typeof data.code === 'string' && /^[A-Z_]+$/.test(data.code)) {
    const params = {};
    if (data.foodCount !== undefined) params.count = data.foodCount;
    const generic = t(`errors.${data.code}`, { ...params, defaultValue: t('errors.saveError', { code: response.status }) });
    if (typeof data.field !== 'string' || !data.field) return generic;
    const field = data.field.replace(/[^A-Za-z0-9]+/g, '_');
    return t(`errors.${data.code}_${field}`, { ...params, defaultValue: generic });
  }
  return t('errors.saveError', { code: response.status });
};

// Feld aus der Fehlerantwort, z. B. "name.de"
export const apiErrorField = (error) => error?.response?.data?.field || '';
