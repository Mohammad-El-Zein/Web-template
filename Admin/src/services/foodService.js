import api from './api';

const toFormData = (foodData, image) => {
  const formData = new FormData();
  formData.append('food', JSON.stringify(foodData));
  if (image) {
    formData.append('file', image);
  }
  return formData;
}

// lang=all liefert Name und Beschreibung in allen Sprachen
export const getFoodList = async () => {
  const response = await api.get('/foods', { params: { lang: 'all' } });
  return response.data;
}

export const getFood = async (foodId) => {
  const response = await api.get(`/foods/${foodId}`, { params: { lang: 'all' } });
  return response.data;
}

export const addFood = async (foodData, image) => {
  const response = await api.post('/foods', toFormData(foodData, image));
  return response.data;
}

// Bild ist beim Bearbeiten optional
export const updateFood = async (foodId, foodData, image) => {
  const response = await api.put(`/foods/${foodId}`, toFormData(foodData, image));
  return response.data;
}

export const deleteFood = async (foodId) => {
  const response = await api.delete(`/foods/${foodId}`);
  return response.status === 204;
}

// Deutscher Text -> { de, en, ar }
export const translateText = async (text) => {
  const response = await api.post('/admin/translate', { text });
  return response.data;
}
