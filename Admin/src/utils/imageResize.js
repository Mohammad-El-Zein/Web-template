import { MAX_IMAGE_SIZE } from '../constants';

// Längste Seite nach dem Verkleinern
export const MAX_IMAGE_SIDE = 1600;
// Erst 0.8, bei Bedarf schrittweise stärker komprimieren
const QUALITIES = [0.8, 0.7, 0.6, 0.5];
// Gleiche Formate wie im Backend erlaubt (kein SVG)
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// code: 'invalid' oder 'tooLarge'
export class ImageError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

// createImageBitmap berücksichtigt die EXIF-Drehung von Handyfotos
const loadImage = async (file) => {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      // ältere Browser: über <img> laden
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new ImageError('invalid')); };
    img.src = url;
  });
};

const toBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

const renamed = (name, extension) => `${(name || 'bild').replace(/\.[^.]+$/, '')}.${extension}`;

// Bild vor dem Upload auf max. 1600 px verkleinern und als WebP (sonst JPEG) komprimieren, Ergebnis < 5 MB
export const prepareImage = async (file) => {
  if (!file || !ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new ImageError('invalid');
  }
  // GIF unverändert lassen, sonst geht die Animation verloren
  if (file.type === 'image/gif') {
    if (file.size > MAX_IMAGE_SIZE) throw new ImageError('tooLarge');
    return file;
  }

  const image = await loadImage(file);
  const { width, height } = image;
  if (!width || !height) throw new ImageError('invalid');

  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext('2d');
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  if (typeof image.close === 'function') image.close();

  let type = 'image/webp';
  let blob = await toBlob(canvas, type, QUALITIES[0]);
  // Browser ohne WebP-Export (ältere Safari) liefern PNG -> JPEG mit weißem Hintergrund statt schwarzer Transparenz
  if (!blob || blob.type !== type) {
    type = 'image/jpeg';
    context.globalCompositeOperation = 'destination-over';
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = 'source-over';
    blob = await toBlob(canvas, type, QUALITIES[0]);
  }
  for (const quality of QUALITIES.slice(1)) {
    if (blob && blob.size <= MAX_IMAGE_SIZE) break;
    blob = await toBlob(canvas, type, quality);
  }
  if (!blob) throw new ImageError('invalid');

  // Kleines PNG/WebP, das neu kodiert größer würde, unverändert lassen
  // (JPEG immer neu kodieren, das entfernt auch EXIF-Daten wie den GPS-Ort)
  if (scale === 1 && file.type !== 'image/jpeg' && file.size <= blob.size && file.size <= MAX_IMAGE_SIZE) {
    return file;
  }
  if (blob.size > MAX_IMAGE_SIZE) throw new ImageError('tooLarge');
  return new File([blob], renamed(file.name, type === 'image/webp' ? 'webp' : 'jpg'), { type, lastModified: Date.now() });
};
