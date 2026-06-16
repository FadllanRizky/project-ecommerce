import axios from 'axios';

// ⚠️ GANTI PORT 5000 DI BAWAH INI SESUAI DENGAN PORT BACKEND LU YANG LAGI JALAN, BOS!
const BACKEND_URL = 'http://localhost:3000'; 

export const transactionApi = {
  // 🛒 Kirim data belanjaan ke backend
  checkout: async (items, shippingRegion, token) => {
    // 🔥 Gabungkan BACKEND_URL dengan endpoint api
    const response = await axios.post(`${BACKEND_URL}/api/transactions/checkout`, {
      shipping_region: shippingRegion,
      items: items,
      payment_method: 'BALANCE'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // 📜 Ambil semua histori belanja khusus user log-in
  getHistory: async (token) => {
    const response = await axios.get(`${BACKEND_URL}/api/transactions/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // ⭐️ Kirim ulasan bintang dan komentar produk
  createReview: async (reviewPayload, token) => {
    const response = await axios.post(`${BACKEND_URL}/api/transactions/review`, reviewPayload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};