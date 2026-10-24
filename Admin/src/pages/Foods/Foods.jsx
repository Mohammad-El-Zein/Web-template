import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { deleteFood, getFoodList } from '../../services/foodService';
import { getCategories } from '../../services/categoryService';
import { formatPrice, localizedText, LANGUAGES } from '../../i18n';
import ConfirmDialog from '../../components/common/ConfirmDialog';

// Filterwert für Gerichte, die noch keiner Kategorie zugeordnet sind
const NO_CATEGORY = 'none';

const hasText = (texts, lang) => typeof texts === 'object' && texts !== null && !!(texts[lang] || '').trim();

const Foods = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFoods = async () => {
    try {
      // Ohne Kategorien trotzdem die Gerichte anzeigen
      const loadCategories = getCategories().catch(() => {
        toast.error(t('categories.loadError'));
        return [];
      });
      const [foodList, categoryList] = await Promise.all([getFoodList(), loadCategories]);
      setFoods(foodList);
      setCategories(categoryList);
    } catch {
      toast.error(t('foods.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
  const hasUnassigned = useMemo(() => foods.some((food) => !categoryById[food.categoryId]), [foods, categoryById]);

  // Suche in allen Sprachen
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return foods.filter((food) => {
      const names = typeof food.name === 'object' && food.name ? Object.values(food.name) : [food.name || ''];
      const matchesSearch = !query || names.some((n) => (n || '').toLowerCase().includes(query));
      const matchesCategory = !categoryId
        || (categoryId === NO_CATEGORY ? !categoryById[food.categoryId] : food.categoryId === categoryId);
      return matchesSearch && matchesCategory;
    });
  }, [foods, search, categoryId, categoryById]);

  const closeDialog = useCallback(() => setToDelete(null), []);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteFood(toDelete.id);
      setFoods((list) => list.filter((f) => f.id !== toDelete.id));
      toast.success(t('foods.deleted'));
      setToDelete(null);
    } catch {
      toast.error(t('foods.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('foods.title')}</h1>
          <p>{t('foods.subtitle', { count: foods.length })}</p>
        </div>
        <Link to="/foods/new" className="btn btn-primary"><i className="bi bi-plus-lg"></i>{t('foods.add')}</Link>
      </div>

      <section className="card-x">
        <div className="toolbar">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input type="search" className="form-control" placeholder={t('foods.searchPlaceholder')}
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="form-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
            aria-label={t('foods.category')}>
            <option value="">{t('foods.allCategories')}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{localizedText(c.name)}</option>)}
            {hasUnassigned && <option value={NO_CATEGORY}>{t('foods.noCategory')}</option>}
          </select>
        </div>

        {loading ? (
          <div className="loading-block"><span className="spinner-border" role="status"></span></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><i className="bi bi-search"></i>{t('foods.empty')}</div>
        ) : (
          <div className="table-scroll">
            <table className="table-x">
              <thead>
                <tr>
                  <th>{t('foods.name')}</th>
                  <th>{t('foods.category')}</th>
                  <th>{t('foods.price')}</th>
                  <th>{t('foods.languages')}</th>
                  <th>{t('foods.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((food) => (
                  <tr key={food.id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        {food.imageUrl ? <img src={food.imageUrl} alt="" className="thumb" /> : <span className="thumb"></span>}
                        <div style={{ minWidth: 0 }}>
                          <p className="cell-title">{localizedText(food.name)}</p>
                          <p className="cell-sub text-truncate" style={{ maxWidth: 320 }}>{localizedText(food.description)}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {categoryById[food.categoryId] ? (
                        <span className="badge-x neutral no-dot">{localizedText(categoryById[food.categoryId].name)}</span>
                      ) : (
                        // Alter Text ohne Zuordnung: sichtbar markieren, damit das Gericht bearbeitet wird
                        <span className="badge-x warning no-dot" title={t('foods.unassigned')}>
                          {food.category || t('foods.noCategory')}
                        </span>
                      )}
                    </td>
                    <td className="nowrap fw-semibold">{formatPrice(food.price)}</td>
                    <td>
                      <div className="lang-chips">
                        {LANGUAGES.map((lang) => {
                          const ok = hasText(food.name, lang.code);
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
                      <div className="actions">
                        <button type="button" className="action-btn" title={t('common.edit')} aria-label={t('common.edit')}
                          onClick={() => navigate(`/foods/${food.id}/edit`)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button type="button" className="action-btn danger" title={t('common.delete')} aria-label={t('common.delete')}
                          onClick={() => setToDelete(food)}>
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
          title={t('foods.deleteTitle')}
          text={t('foods.deleteText', { name: localizedText(toDelete.name) })}
          confirmLabel={t('common.delete')}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={closeDialog}
        />
      )}
    </>
  );
};

export default Foods;
