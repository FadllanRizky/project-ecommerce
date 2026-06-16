import api from './axiosInstance';

// 💬 ambil chat (Diberi parameter 'params' agar admin bisa filter room chat via Axios)
export const getChats = (params) => api.get('/chat', { params });

// 👑 admin → list user yang chat
export const getChatUsers = () => api.get('/chat/admin/users');

// ✉️ kirim pesan
export const sendMessage = (data) => api.post('/chat', data);