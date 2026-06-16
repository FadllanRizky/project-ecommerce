import api from './axiosInstance';

// 🔍 PUBLIC / USER
export const getProducts = () => api.get('/products');

// 👑 ADMIN
export const createProduct = (data) => api.post('/admin/products', data);

export const updateProduct = (id, data) =>
  api.put(`/admin/products/${id}`, data);

export const deleteProduct = (id) =>
  api.delete(`/admin/products/${id}`);