import api from './api';

export const login = async (email, password) => {
  const response = await api.post('/login', { email, password });
  return response.data;
}

export const getProfile = async () => {
  const response = await api.get('/me');
  return response.data;
}

export const updateProfile = async (name) => {
  const response = await api.put('/me', { name });
  return response.data;
}

export const changePassword = async (currentPassword, newPassword) => {
  await api.put('/me/password', { currentPassword, newPassword });
}
