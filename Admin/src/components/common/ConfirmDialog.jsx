import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const ConfirmDialog = ({ title, text, confirmLabel, busy, onConfirm, onCancel }) => {
  const { t } = useTranslation();

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && !busy && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onCancel]);

  return (
    <div className="modal-x-backdrop" onClick={() => !busy && onCancel()}>
      <div className="modal-x" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-x-icon"><i className="bi bi-trash3"></i></div>
        <h3 id="confirm-title">{title}</h3>
        <p>{text}</p>
        <div className="modal-x-actions">
          <button type="button" className="btn btn-light" onClick={onCancel} disabled={busy}>{t('common.cancel')}</button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy} autoFocus>
            {busy && <span className="spinner-border spinner-inline" aria-hidden="true"></span>}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
