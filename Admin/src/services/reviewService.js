import api from './api';

// Alle Bewertungen inkl. ausgeblendeter, Texte in allen Sprachen, sortiert
export const getReviews = async () => {
  const response = await api.get('/admin/reviews');
  return response.data;
}

// { authorName, text: { de, en, ar }, rating, photoUrl, source, date: "YYYY-MM-DD" | "", visible }
export const addReview = async (review) => {
  const response = await api.post('/admin/reviews', review);
  return response.data;
}

export const updateReview = async (reviewId, review) => {
  const response = await api.put(`/admin/reviews/${reviewId}`, review);
  return response.data;
}

export const deleteReview = async (reviewId) => {
  const response = await api.delete(`/admin/reviews/${reviewId}`);
  return response.status === 204;
}

// Antwort vom Backend wieder in eine Anfrage umwandeln (z. B. Schalter "sichtbar" in der Liste)
export const toReviewRequest = (review) => ({
  authorName: review.authorName,
  text: review.text,
  rating: review.rating,
  photoUrl: review.photoUrl || '',
  source: review.source || '',
  date: review.date || '',
  visible: review.visible,
});

// ids in der neuen Reihenfolge, liefert die sortierte Liste zurück
export const reorderReviews = async (ids) => {
  const response = await api.put('/admin/reviews/order', ids);
  return response.data;
}
