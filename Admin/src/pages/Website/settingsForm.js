// Hilfsfunktionen für die Website-Einstellungen (ohne React)

export const LANGS = ['de', 'en', 'ar'];
export const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
export const PAGES = ['general', 'home', 'about', 'contact', 'ordering', 'legal'];

// Gleiche Grenzen wie im Backend (SiteSettingsServiceImpl)
export const LIMITS = { name: 100, short: 200, long: 5000, legal: 20000, url: 500, address: 300, phone: 50 };
export const MAX_FEATURES = 8;
export const MAX_SLOTS = 5;
export const MAX_SOCIAL_LINKS = 10;
// POST /api/admin/translate nimmt höchstens 2000 Zeichen
export const TRANSLATE_LIMIT = 2000;

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

// Stabile Schlüssel für Listen (Reihenfolge änderbar), werden nicht gespeichert
let keyCounter = 0;
export const newKey = () => `k${(keyCounter += 1)}`;

const texts = (value) => ({ de: value?.de || '', en: value?.en || '', ar: value?.ar || '' });

export const emptyFeature = () => ({ _key: newKey(), title: texts(), text: texts(), imageUrl: '' });
export const emptySocialLink = () => ({ _key: newKey(), name: '', url: '' });

// Antwort vom Backend in eine vollständige, bearbeitbare Form bringen
export const normalize = (s = {}) => {
  const contact = s.contact || {};
  const hours = s.openingHours || {};
  const ordering = s.ordering || {};
  const enabled = (s.enabledLanguages || []).filter((l) => LANGS.includes(l));
  return {
    restaurantName: s.restaurantName || '',
    slogan: texts(s.slogan),
    logoUrl: s.logoUrl || '',
    faviconUrl: s.faviconUrl || '',
    primaryColor: s.primaryColor || '',
    accentColor: s.accentColor || '',
    heroTitle: texts(s.heroTitle),
    heroSubtitle: texts(s.heroSubtitle),
    heroImageUrl: s.heroImageUrl || '',
    features: (s.features || []).map((f) => ({
      _key: newKey(), title: texts(f?.title), text: texts(f?.text), imageUrl: f?.imageUrl || '',
    })),
    aboutTitle: texts(s.aboutTitle),
    aboutText: texts(s.aboutText),
    aboutImageUrl: s.aboutImageUrl || '',
    contact: {
      address: contact.address || '',
      phone: contact.phone || '',
      email: contact.email || '',
      whatsapp: contact.whatsapp || '',
      googleMapsUrl: contact.googleMapsUrl || '',
      // Map -> Liste, damit der Name beim Tippen geändert werden kann
      socialLinks: Object.entries(contact.socialLinks || {}).map(([name, url]) => ({ _key: newKey(), name, url: url || '' })),
    },
    openingHours: {
      timeZone: hours.timeZone || 'Europe/Berlin',
      days: Object.fromEntries(DAYS.map((day) => [
        day, (hours.days?.[day] || []).map((slot) => ({ open: slot?.open || '', close: slot?.close || '' })),
      ])),
    },
    ordering: {
      deliveryFee: ordering.deliveryFee ?? 0,
      minOrderAmount: ordering.minOrderAmount ?? 0,
      pickupEnabled: ordering.pickupEnabled ?? true,
      deliveryEnabled: ordering.deliveryEnabled ?? true,
      ordersOnlyDuringOpeningHours: ordering.ordersOnlyDuringOpeningHours ?? false,
    },
    enabledLanguages: enabled.length ? enabled : [...LANGS],
    defaultLanguage: s.defaultLanguage || 'de',
    imprint: texts(s.imprint),
    privacyPolicy: texts(s.privacyPolicy),
    footerText: texts(s.footerText),
  };
};

const toAmount = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

// Bearbeitete Form -> JSON für PUT /api/admin/settings
export const toPayload = (d) => ({
  ...d,
  // _key nur für die Bearbeitung, nicht speichern
  features: d.features.map((f) => ({ title: f.title, text: f.text, imageUrl: f.imageUrl })),
  contact: {
    ...d.contact,
    socialLinks: Object.fromEntries(d.contact.socialLinks
      .filter((link) => link.name.trim() || link.url.trim())
      .map((link) => [link.name.trim(), link.url.trim()])),
  },
  ordering: {
    ...d.ordering,
    deliveryFee: toAmount(d.ordering.deliveryFee),
    minOrderAmount: toAmount(d.ordering.minOrderAmount),
  },
});

// Gespeicherte URL in den Entwurf schreiben; key = Feldname oder "feature:<_key>"
export const withImageUrl = (d, key, url) => {
  if (key.startsWith('feature:')) {
    const featureKey = key.slice('feature:'.length);
    return { ...d, features: d.features.map((f) => (f._key === featureKey ? { ...f, imageUrl: url } : f)) };
  }
  return { ...d, [key]: url };
};

// Wert über einen Pfad wie ['features', 2, 'title'] lesen
export const getIn = (object, path) => path.reduce((value, key) => value?.[key], object);

// Fehlerfeld vom Backend (z. B. "features[2].title.en") -> Seite und Sprache
const PAGE_BY_FIELD = {
  restaurantName: 'general', slogan: 'general', logoUrl: 'general', faviconUrl: 'general',
  primaryColor: 'general', accentColor: 'general', enabledLanguages: 'general', defaultLanguage: 'general',
  heroTitle: 'home', heroSubtitle: 'home', heroImageUrl: 'home', features: 'home',
  aboutTitle: 'about', aboutText: 'about', aboutImageUrl: 'about',
  contact: 'contact', openingHours: 'contact', ordering: 'ordering',
  imprint: 'legal', privacyPolicy: 'legal', footerText: 'legal',
};

export const fieldLocation = (field = '') => {
  const root = field.split(/[.[]/)[0];
  const last = field.split('.').pop();
  return { page: PAGE_BY_FIELD[root] || 'general', lang: LANGS.includes(last) ? last : null };
};

// Übersetzten Fehlertext je nach Art des Feldes wählen (Backend schickt nur englische Meldungen)
export const settingsErrorText = (t, field = '', message = '') => {
  const max = message.match(/max (\d+)/);
  if (max && /too long/i.test(message)) return t('website.errors.tooLong', { max: max[1] });
  if (/Color$/.test(field)) return t('website.errors.color');
  if (/^openingHours\.days\.[A-Z]+\[\d+\]\.(open|close)$/.test(field)) return t('website.errors.time');
  if (/^openingHours\.days\.[A-Z]+\[\d+\]$/.test(field)) return t('website.errors.sameTime');
  if (/^openingHours\.days\.[A-Z]+$/.test(field)) return t('website.errors.tooManySlots', { max: MAX_SLOTS });
  if (field === 'openingHours.timeZone') return t('website.errors.timeZone');
  if (field === 'contact.email') return t('website.errors.email');
  if (field.startsWith('ordering.')) return t('website.errors.amount');
  if (field === 'contact.socialLinks') {
    return /name/i.test(message) ? t('website.errors.socialName') : t('website.errors.tooManySocial', { max: MAX_SOCIAL_LINKS });
  }
  if (/Url$/i.test(field) || field.startsWith('contact.socialLinks.')) return t('website.errors.url');
  if (field === 'restaurantName') return t('website.errors.nameRequired');
  if (field === 'enabledLanguages' || field === 'defaultLanguage') return t('website.errors.languages');
  if (field === 'features') return t('website.errors.tooManyFeatures', { max: MAX_FEATURES });
  return t('errors.SETTINGS_INVALID');
};
