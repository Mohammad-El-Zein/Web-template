import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { deleteReview, getReviews, reorderReviews, toReviewRequest, updateReview } from '../../services/reviewService';
import { localizedText } from '../../i18n';
import { apiErrorMessage } from '../../utils/apiErrors';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Switch from '../../components/common/Switch';
import Avatar from '../../components/common/Avatar';
import RealReviewsNotice from '../../components/common/RealReviewsNotice';
import { Stars } from '../../components/common/Stars';

const Reviews = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getReviews()
      .then(setReviews)
      .catch(() => toast.error(t('reviews.loadError')))
      .finally(() => setLoading(false));
  }, [t]);

  // Sofort umsortieren, dann speichern; bei Fehler alte Reihenfolge zurück
  const move = async (index, direction) => {
    const previous = reviews;
    const next = [...reviews];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    setReviews(next);
    setReordering(true);
    try {
      setReviews(await reorderReviews(next.map((r) => r.id)));
    } catch (error) {
      setReviews(previous);
      toast.error(apiErrorMessage(error, t));
    } finally {
      setReordering(false);
    }
  };

  const toggleVisible = async (review) => {
    const visible = !review.visible;
    const replace = (value) => setReviews((list) => list.map((r) => (r.id === review.id ? value : r)));
    replace({ ...review, visible });
    setTogglingId(review.id);
    try {
      replace(await updateReview(review.id, { ...toReviewRequest(review), visible }));
      toast.success(t(visible ? 'reviews.shown' : 'reviews.hidden'));
    } catch (error) {
      replace(review);
      toast.error(apiErrorMessage(error, t));
    } finally {
      setTogglingId(null);
    }
  };

  const closeDialog = useCallback(() => setToDelete(null), []);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteReview(toDelete.id);
      setReviews((list) => list.filter((r) => r.id !== toDelete.id));
      toast.success(t('reviews.deleted'));
      setToDelete(null);
    } catch (error) {
      toast.error(apiErrorMessage(error, t));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('reviews.title')}</h1>
          <p>{t('reviews.subtitle', { count: reviews.length })}</p>
        </div>
        <Link to="/reviews/new" className="btn btn-primary"><i className="bi bi-plus-lg"></i>{t('reviews.add')}</Link>
      </div>

      <RealReviewsNotice />

      <section className="card-x">
        {loading ? (
          <div className="loading-block"><span className="spinner-border" role="status"></span></div>
        ) : reviews.length === 0 ? (
          <div className="empty-state"><i className="bi bi-chat-quote"></i>{t('reviews.empty')}</div>
        ) : (
          <div className="table-scroll">
            <table className="table-x">
              <thead>
                <tr>
                  <th>{t('reviews.author')}</th>
                  <th>{t('reviews.rating')}</th>
                  <th>{t('reviews.text')}</th>
                  <th>{t('reviews.source')}</th>
                  <th>{t('reviews.visible')}</th>
                  <th>{t('reviews.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review, index) => (
                  <tr key={review.id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        {review.photoUrl ? <img src={review.photoUrl} alt="" className="thumb" /> : <Avatar name={review.authorName} />}
                        <p className="cell-title">{review.authorName}</p>
                      </div>
                    </td>
                    <td><Stars rating={review.rating} /></td>
                    <td><p className="review-text">{localizedText(review.text)}</p></td>
                    <td className="nowrap">{review.source || <span className="text-muted">–</span>}</td>
                    <td>
                      <Switch checked={review.visible} disabled={togglingId === review.id}
                        label={`${t('reviews.visible')}: ${review.authorName}`} onChange={() => toggleVisible(review)} />
                    </td>
                    <td>
                      <div className="actions">
                        <button type="button" className="action-btn" title={t('categories.moveUp')} aria-label={t('categories.moveUp')}
                          disabled={index === 0 || reordering} onClick={() => move(index, -1)}>
                          <i className="bi bi-arrow-up"></i>
                        </button>
                        <button type="button" className="action-btn" title={t('categories.moveDown')} aria-label={t('categories.moveDown')}
                          disabled={index === reviews.length - 1 || reordering} onClick={() => move(index, 1)}>
                          <i className="bi bi-arrow-down"></i>
                        </button>
                        <button type="button" className="action-btn" title={t('common.edit')} aria-label={t('common.edit')}
                          onClick={() => navigate(`/reviews/${review.id}/edit`)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button type="button" className="action-btn danger" title={t('common.delete')} aria-label={t('common.delete')}
                          onClick={() => setToDelete(review)}>
                          <i className="bi bi-trash3"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {toDelete && (
        <ConfirmDialog
          title={t('reviews.deleteTitle')}
          text={t('reviews.deleteText', { name: toDelete.authorName })}
          confirmLabel={t('common.delete')}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={closeDialog}
        />
      )}
    </>
  );
};

export default Reviews;
