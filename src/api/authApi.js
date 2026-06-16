import api from './axiosInstance';

// 🔐 LOGIN
export const loginApi = (data) => api.post('/auth/login', data);

// 📝 REGISTER
export const registerApi = (data) => api.post('/auth/register', data);