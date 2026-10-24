import React from 'react';
import { useTranslation } from 'react-i18next';
import { useWebsite } from './WebsiteContext';
import { FieldError, SwitchRow } from './WebsiteFields';

const AmountField = ({ id, label, hint, path, value, onChange }) => {
  const { hasError } = useWebsite();
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">{label}</label>
      <div className="price-input" dir="ltr">
        <input id={id} type="number" min="0" max="1000" step="0.01" dir="ltr" placeholder="0.00"
          className={`form-control ${hasError(path) ? 'invalid' : ''}`} value={value} onChange={(e) => onChange(e.target.value)} />
        <span>€</span>
      </div>
      {hint && <p className="form-hint">{hint}</p>}
      <FieldError path={path} />
    </div>
  );
};

const Ordering = () => {
  const { t } = useTranslation();
  const { draft, change } = useWebsite();
  const { ordering } = draft;
  const set = (key) => (value) => change((d) => { d.ordering[key] = value; });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('website.ordering.title')}</h1>
          <p>{t('website.ordering.subtitle')}</p>
        </div>
      </div>

      <div className="form-grid">
        <section className="card-x">
          <div className="card-x-header"><h2>{t('website.ordering.costsTitle')}</h2></div>
          <div className="card-x-body">
            <AmountField id="order-fee" label={t('website.ordering.deliveryFee')} hint={t('website.ordering.deliveryFeeHint')}
              path="ordering.deliveryFee" value={ordering.deliveryFee} onChange={set('deliveryFee')} />
            <AmountField id="order-min" label={t('website.ordering.minOrderAmount')} hint={t('website.ordering.minOrderHint')}
              path="ordering.minOrderAmount" value={ordering.minOrderAmount} onChange={set('minOrderAmount')} />
          </div>
        </section>

        <section className="card-x">
          <div className="card-x-header"><h2>{t('website.ordering.typesTitle')}</h2></div>
          <div className="card-x-body">
            <SwitchRow id="order-delivery" label={t('website.ordering.delivery')} hint={t('website.ordering.deliveryHint')}
              checked={ordering.deliveryEnabled} onChange={set('deliveryEnabled')} />
            <SwitchRow id="order-pickup" label={t('website.ordering.pickup')} hint={t('website.ordering.pickupHint')}
              checked={ordering.pickupEnabled} onChange={set('pickupEnabled')} />
            <SwitchRow id="order-only-open" label={t('website.ordering.onlyOpen')} hint={t('website.ordering.onlyOpenHint')}
              checked={ordering.ordersOnlyDuringOpeningHours} onChange={set('ordersOnlyDuringOpeningHours')} />
            {!ordering.deliveryEnabled && !ordering.pickupEnabled && (
              <p className="field-error" role="status"><i className="bi bi-exclamation-triangle"></i> {t('website.ordering.noTypes')}</p>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default Ordering;
