import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Switch from '../../components/common/Switch';
import { useWebsite } from './WebsiteContext';
import { FieldError } from './WebsiteFields';
import { DAYS, emptySocialLink, LIMITS, MAX_SLOTS, MAX_SOCIAL_LINKS } from './settingsForm';

// Netzwerk-Namen wie im Backend erlaubt: a-z, 0-9, "_" und "-"
const socialName = (value) => value.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30);

const TextField = ({ id, label, path, value, onChange, type = 'text', maxLength, hint, ltr, rows, placeholder }) => {
  const { hasError } = useWebsite();
  const props = {
    id, maxLength, placeholder, value, dir: ltr ? 'ltr' : undefined,
    className: `form-control ${hasError(path) ? 'invalid' : ''}`,
    onChange: (e) => onChange(e.target.value),
  };
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">{label}</label>
      {rows ? <textarea rows={rows} {...props} /> : <input type={type} {...props} />}
      {hint && <p className="form-hint">{hint}</p>}
      <FieldError path={path} />
    </div>
  );
};

const Contact = () => {
  const { t } = useTranslation();
  const { draft, change, hasError } = useWebsite();
  const { contact, openingHours } = draft;

  // Alle Zeitzonen des Browsers, aktuelle immer dabei
  const zones = useMemo(() => {
    try {
      const list = Intl.supportedValuesOf('timeZone');
      return list.includes(openingHours.timeZone) ? list : [openingHours.timeZone, ...list];
    } catch {
      return [];
    }
  }, [openingHours.timeZone]);

  const setContact = (key) => (value) => change((d) => { d.contact[key] = value; });

  const copyMonday = () => {
    change((d) => {
      DAYS.forEach((day) => {
        d.openingHours.days[day] = d.openingHours.days.MONDAY.map((slot) => ({ ...slot }));
      });
    });
    toast.info(t('website.contact.copied'));
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('website.contact.title')}</h1>
          <p>{t('website.contact.subtitle')}</p>
        </div>
      </div>

      <div className="form-grid">
        <section className="card-x">
          <div className="card-x-header"><h2>{t('website.contact.contactTitle')}</h2></div>
          <div className="card-x-body">
            <TextField id="contact-address" label={t('website.contact.address')} path="contact.address" rows={2}
              maxLength={LIMITS.address} value={contact.address} onChange={setContact('address')} />
            <div className="row g-3">
              <div className="col-sm-6">
                <TextField id="contact-phone" type="tel" label={t('website.contact.phone')} path="contact.phone" ltr
                  maxLength={LIMITS.phone} value={contact.phone} onChange={setContact('phone')} />
              </div>
              <div className="col-sm-6">
                <TextField id="contact-whatsapp" type="tel" label={t('website.contact.whatsapp')} path="contact.whatsapp" ltr
                  maxLength={LIMITS.phone} value={contact.whatsapp} onChange={setContact('whatsapp')}
                  hint={t('website.contact.whatsappHint')} />
              </div>
            </div>
            <TextField id="contact-email" type="email" label={t('website.contact.email')} path="contact.email" ltr
              maxLength={LIMITS.short} value={contact.email} onChange={setContact('email')} />
            <TextField id="contact-maps" type="url" label={t('website.contact.mapsUrl')} path="contact.googleMapsUrl" ltr
              maxLength={LIMITS.url} value={contact.googleMapsUrl} onChange={setContact('googleMapsUrl')}
              placeholder="https://maps.google.com/..." />
          </div>
        </section>

        <section className="card-x">
          <div className="card-x-header"><h2>{t('website.contact.socialTitle')}</h2></div>
          <div className="card-x-body">
            <p className="form-hint mt-0 mb-3">{t('website.contact.socialHint')}</p>
            <FieldError path="contact.socialLinks" />
            {contact.socialLinks.length === 0 && (
              <div className="empty-state"><i className="bi bi-share"></i>{t('website.contact.noSocial')}</div>
            )}
            {contact.socialLinks.map((link, index) => (
              <div key={link._key} className="mb-2">
                <div className="social-row">
                  <input type="text" className="form-control" dir="ltr" aria-label={t('website.contact.socialName')}
                    placeholder="instagram" value={link.name}
                    onChange={(e) => change((d) => { d.contact.socialLinks[index].name = socialName(e.target.value); })} />
                  <input type="url" dir="ltr" aria-label={t('website.contact.socialUrl')} maxLength={LIMITS.url}
                    className={`form-control ${hasError(`contact.socialLinks.${link.name}`) ? 'invalid' : ''}`}
                    placeholder="https://..." value={link.url}
                    onChange={(e) => change((d) => { d.contact.socialLinks[index].url = e.target.value; })} />
                  <button type="button" className="action-btn danger" title={t('website.contact.removeSocial')}
                    aria-label={t('website.contact.removeSocial')}
                    onClick={() => change((d) => { d.contact.socialLinks.splice(index, 1); })}>
                    <i className="bi bi-trash3"></i>
                  </button>
                </div>
                <FieldError path={`contact.socialLinks.${link.name}`} />
              </div>
            ))}
            <button type="button" className="btn btn-soft mt-2" disabled={contact.socialLinks.length >= MAX_SOCIAL_LINKS}
              onClick={() => change((d) => { d.contact.socialLinks.push(emptySocialLink()); })}>
              <i className="bi bi-plus-lg"></i>{t('website.contact.addSocial')}
            </button>
          </div>
        </section>
      </div>

      <section className="card-x mt-3">
        <div className="card-x-header">
          <h2>{t('website.contact.hoursTitle')}</h2>
          <button type="button" className="btn btn-soft btn-sm" onClick={copyMonday}>
            <i className="bi bi-copy"></i>{t('website.contact.copyMonday')}
          </button>
        </div>
        <div className="card-x-body">
          <p className="form-hint mt-0">{t('website.contact.hoursHint')}</p>

          {DAYS.map((day) => {
            const slots = openingHours.days[day];
            const open = slots.length > 0;
            const dayName = t(`website.days.${day}`);
            return (
              <div key={day} className="hours-row">
                <div className="hours-day">{dayName}</div>
                <div className="hours-switch">
                  <Switch checked={open} label={`${dayName}: ${t('website.contact.open')}`}
                    onChange={(on) => change((d) => { d.openingHours.days[day] = on ? [{ open: '11:00', close: '22:00' }] : []; })} />
                </div>
                <div className="hours-slots">
                  {!open && <span className="hours-closed">{t('website.contact.closed')}</span>}
                  {slots.map((slot, index) => {
                    const path = `openingHours.days.${day}[${index}]`;
                    return (
                      <div key={index}>
                        <div className="time-slot" dir="ltr">
                          <input type="time" aria-label={`${dayName} ${t('website.contact.from')}`}
                            className={`form-control ${hasError(`${path}.open`) || hasError(path) ? 'invalid' : ''}`}
                            value={slot.open} onChange={(e) => change((d) => { d.openingHours.days[day][index].open = e.target.value; })} />
                          <span aria-hidden="true">–</span>
                          <input type="time" aria-label={`${dayName} ${t('website.contact.to')}`}
                            className={`form-control ${hasError(`${path}.close`) || hasError(path) ? 'invalid' : ''}`}
                            value={slot.close} onChange={(e) => change((d) => { d.openingHours.days[day][index].close = e.target.value; })} />
                          <button type="button" className="action-btn danger" title={t('website.contact.removeSlot')}
                            aria-label={t('website.contact.removeSlot')}
                            onClick={() => change((d) => { d.openingHours.days[day].splice(index, 1); })}>
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </div>
                        <FieldError path={path} />
                        <FieldError path={`${path}.open`} />
                        <FieldError path={`${path}.close`} />
                      </div>
                    );
                  })}
                  {open && slots.length < MAX_SLOTS && (
                    <button type="button" className="link-btn align-self-start"
                      onClick={() => change((d) => { d.openingHours.days[day].push({ open: '17:00', close: '22:00' }); })}>
                      <i className="bi bi-plus-lg"></i> {t('website.contact.addSlot')}
                    </button>
                  )}
                  <FieldError path={`openingHours.days.${day}`} />
                </div>
              </div>
            );
          })}

          <div className="mt-3" style={{ maxWidth: 360 }}>
            <label htmlFor="site-timezone" className="form-label">{t('website.contact.timeZone')}</label>
            {zones.length > 0 ? (
              <select id="site-timezone" dir="ltr" className={`form-select ${hasError('openingHours.timeZone') ? 'invalid' : ''}`}
                value={openingHours.timeZone} onChange={(e) => change((d) => { d.openingHours.timeZone = e.target.value; })}>
                {zones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
              </select>
            ) : (
              <input id="site-timezone" type="text" dir="ltr" className={`form-control ${hasError('openingHours.timeZone') ? 'invalid' : ''}`}
                value={openingHours.timeZone} onChange={(e) => change((d) => { d.openingHours.timeZone = e.target.value.trim(); })} />
            )}
            <FieldError path="openingHours.timeZone" />
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
