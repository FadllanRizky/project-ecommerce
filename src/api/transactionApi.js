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
  },

  updateStatus: async (id, status, token) => {
    const response = await api.patch(`/transactions/${id}/status`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  shipOrder: async (id, token) => {
    const response = await api.patch(`/transactions/${id}/status`, { status: 'shipping' }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  completeOrder: async (id, token) => {
    const response = await api.patch(`/transactions/${id}/status`, { status: 'completed' }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Alias ramah untuk tombol "Pesanan Sudah Diterima" di History
  confirmReceived: async (id, token) => {
    const response = await api.patch(`/transactions/${id}/status`, { status: 'completed' }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};
