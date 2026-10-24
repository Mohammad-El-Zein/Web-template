import api from './api';

// folder = foods | categories | site, liefert die öffentliche URL
export const uploadImage = async (file, folder) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  const response = await api.post('/admin/images', formData);
  return response.data.url;
}
