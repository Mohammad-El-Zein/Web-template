import api from './api';

export const getAllOrders = async () => {
  try {
    const response = await api.get('/admin/orders');
    return response.data;
  } catch (error) {
    console.log('Fehler beim Abrufen der Bestellungen', error);
    throw error;
  }
}

export const updateOrderStatus = async (orderId, orderStatus) => {
  try {
    const response = await api.patch(`/admin/orders/${orderId}/status`, { orderStatus });
    return response.data;
  } catch (error) {
    console.log('Fehler beim Ändern des Status', error);
    throw error;
  }
}
