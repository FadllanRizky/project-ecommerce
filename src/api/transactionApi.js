import api from './axiosInstance';

export const transactionApi = {
  checkout: async (items, shippingRegion, token) => {
    const response = await api.post('/transactions/checkout', {
      shipping_region: shippingRegion,
      items: items,
      payment_method: 'BALANCE'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  getHistory: async (token) => {
    const response = await api.get('/transactions/history', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  createReview: async (reviewPayload, token) => {
    const response = await api.post('/transactions/review', reviewPayload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};
