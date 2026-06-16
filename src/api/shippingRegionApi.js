import api from './axiosInstance';

export const shippingRegionApi = {
  getAll: async () => {
    const response = await api.get('/shipping-regions');
    return response.data;
  },

  create: async (data, token) => {
    const response = await api.post('/shipping-regions', data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  update: async (id, data, token) => {
    const response = await api.put(`/shipping-regions/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  remove: async (id, token) => {
    const response = await api.delete(`/shipping-regions/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};
