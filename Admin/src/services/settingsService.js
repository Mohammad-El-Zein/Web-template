import api from './api';

// Alle Website-Inhalte (ein einziges Dokument)
export const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
}

// Ersetzt das ganze Dokument, daher immer das vollständige JSON schicken
export const saveSettings = async (settings) => {
  const response = await api.put('/admin/settings', settings);
  return response.data;
}
