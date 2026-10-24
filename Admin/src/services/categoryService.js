import api from './api';

// Alle Kategorien inkl. inaktiver, Namen in allen Sprachen, sortiert
export const getCategories = async () => {
  const response = await api.get('/admin/categories');
  return response.data;
}

// { name: { de, en, ar }, imageUrl, active }
export const addCategory = async (category) => {
  const response = await api.post('/admin/categories', category);
  return response.data;
}

export const updateCategory = async (categoryId, category) => {
  const response = await api.put(`/admin/categories/${categoryId}`, category);
  return response.data;
}

export const deleteCategory = async (categoryId) => {
  const response = await api.delete(`/admin/categories/${categoryId}`);
  return response.status === 204;
}

// ids in der neuen Reihenfolge, liefert die sortierte Liste zurück
export const reorderCategories = async (ids) => {
  const response = await api.put('/admin/categories/order', ids);
  return response.data;
}
