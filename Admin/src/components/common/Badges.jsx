import React from 'react';
import { useTranslation } from 'react-i18next';

const ORDER_STATUS_TONE = {
  PENDING: 'warning',
  PREPARING: 'info',
  OUT_FOR_DELIVERY: 'brand',
  DELIVERED: 'success',
  CANCELLED: 'neutral',
};

const PAYMENT_TONE = { PAID: 'success', PENDING: 'warning', FAILED: 'danger' };

export const OrderStatusBadge = ({ status }) => {
  const { t } = useTranslation();
  const value = status || 'PENDING';
  return <span className={`badge-x ${ORDER_STATUS_TONE[value] || 'neutral'}`}>{t(`status.${value}`)}</span>;
};

export const PaymentBadge = ({ status }) => {
  const { t } = useTranslation();
  const value = status || 'PENDING';
  return <span className={`badge-x ${PAYMENT_TONE[value] || 'neutral'}`}>{t(`payment.${value}`)}</span>;
};
