import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { deleteCategory, getCategories, reorderCategories, updateCategory } from '../../services/categoryService';
import { getFoodList } from '../../services/foodService';
import { localizedText, LANGUAGES } from '../../i18n';
import { apiErrorMessage } from '../../utils/apiErrors';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Switch from '../../components/common/Switch';

const hasText = (texts, lang) => !!(texts?.[lang] || '').trim();

const Categories = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([getCategories(), getFoodList()])
      .then(([categoryList, foodList]) => {
        setCategories(categoryList);
        setFoods(foodList);
      })
      .catch(() => toast.error(t('categories.loadError')))
      .finally(() => setLoading(false));
  }, [t]);

  // Anzahl Gerichte pro Kategorie (das Backend liefert sie nicht mit)
  const foodCounts = useMemo(() => {
    const counts = {};
    foods.forEach((food) => {
      if (food.categoryId) counts[food.categoryId] = (counts[food.categoryId] || 0) + 1;
    });
    return counts;
  }, [foods]);

  // Sofort umsortieren, dann speichern; bei Fehler alte Reihenfolge zurück
  const move = async (index, direction) => {
    const previous = categories;
    const next = [...categories];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    setCategories(next);
    setReordering(true);
    try {
      setCategories(await reorderCategories(next.map((c) => c.id)));
    } catch (error) {
      setCategories(previous);
      toast.error(apiErrorMessage(error, t));
    } finally {
      setReordering(false);
    }
  };

  const toggleActive = async (category) => {
    const active = !category.active;
    const replace = (value) => setCategories((list) => list.map((c) => (c.id === category.id ? value : c)));
    replace({ ...category, active });
    setTogglingId(category.id);
    try {
      replace(await updateCategory(category.id, { name: category.name, imageUrl: category.imageUrl || '', active }));
      toast.success(t(active ? 'categories.activated' : 'categories.deactivated'));
    } catch (error) {
      replace(category);
      toast.error(apiErrorMessage(error, t));
    } finally {
      setTogglingId(null);
    }
  };

  // Kategorie mit Gerichten gar nicht erst zum Löschen anbieten
  const askDelete = (category) => {
    const count = foodCounts[category.id] || 0;
    if (count > 0) {
      toast.error(t('categories.notEmpty', { name: localizedText(category.name), count }));
      return;
    }
    setToDelete(category);
  };

  const closeDialog = useCallback(() => setToDelete(null), []);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteCategory(toDelete.id);
      setCategories((list) => list.filter((c) => c.id !== toDelete.id));
      toast.success(t('categories.deleted'));
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
          <h1>{t('categories.title')}</h1>
          <p>{t('categories.subtitle', { count: categories.length })}</p>
        </div>
        <Link to="/categories/new" className="btn btn-primary"><i className="bi bi-plus-lg"></i>{t('categories.add')}</Link>
      </div>

      <section className="card-x">
        {loading ? (
          <div className="loading-block"><span className="spinner-border" role="status"></span></div>
        ) : categories.length === 0 ? (
          <div className="empty-state"><i className="bi bi-tags"></i>{t('categories.empty')}</div>
        ) : (
          <div className="table-scroll">
            <table className="table-x">
              <thead>
                <tr>
                  <th>{t('categories.name')}</th>
                  <th>{t('categories.dishes')}</th>
                  <th>{t('categories.languages')}</th>
                  <th>{t('categories.active')}</th>
                  <th>{t('categories.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category, index) => {
                  const name = localizedText(category.name);
                  return (
                    <tr key={category.id}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          {category.imageUrl ? <img src={category.imageUrl} alt="" className="thumb" /> : <span className="thumb"></span>}
                          <div style={{ minWidth: 0 }}>
                            <p className="cell-title">{name}</p>
                            <p className="cell-sub mono" dir="ltr">{category.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="nowrap fw-semibold">{foodCounts[category.id] || 0}</td>
                      <td>
                        <div className="lang-chips">
                          {LANGUAGES.map((lang) => {
                            const ok = hasText(category.name, lang.code);
                            return (
                              <span key={lang.code} className={`lang-chip ${ok ? 'ok' : 'missing'}`}
                                title={ok ? t(`languages.${lang.code}`) : `${t(`languages.${lang.code}`)}: ${t('foods.missingLanguage')}`}>
                                {lang.code.toUpperCase()}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td>
                        <Switch checked={category.active} disabled={togglingId === category.id}
                          label={`${t('categories.active')}: ${name}`} onChange={() => toggleActive(category)} />
                      </td>
                      <td>
                        <div className="actions">
                          <button type="button" className="action-btn" title={t('categories.moveUp')} aria-label={t('categories.moveUp')}
                            disabled={index === 0 || reordering} onClick={() => move(index, -1)}>
                            <i className="bi bi-arrow-up"></i>
                          </button>
                          <button type="button" className="action-btn" title={t('categories.moveDown')} aria-label={t('categories.moveDown')}
                            disabled={index === categories.length - 1 || reordering} onClick={() => move(index, 1)}>
                            <i className="bi bi-arrow-down"></i>
                          </button>
                          <button type="button" className="action-btn" title={t('common.edit')} aria-label={t('common.edit')}
                            onClick={() => navigate(`/categories/${category.id}/edit`)}>
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button type="button" className="action-btn danger" title={t('common.delete')} aria-label={t('common.delete')}
                            onClick={() => askDelete(category)}>
                            <i className="bi bi-trash3"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {toDelete && (
        <ConfirmDialog
          title={t('categories.deleteTitle')}
          text={t('categories.deleteText', { name: localizedText(toDelete.name) })}
          confirmLabel={t('common.delete')}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={closeDialog}
        />
      )}
    </>
  );
};

export default Categories;
