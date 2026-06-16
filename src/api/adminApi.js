import api from './axiosInstance';

export const adminService = {
  // 👥 MANAGEMENT USERS
  getUsers: () => api.get('/admin/users'),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  // 💰 MANAGEMENT LOANS
  getLoans: () => api.get('/admin/loans'),
  approveLoan: (id) => api.put(`/admin/loans/${id}/approve`),
  rejectLoan: (id) => api.put(`/admin/loans/${id}/reject`),

  // 📦 MANAGEMENT PRODUCTS
  getProducts: () => api.get('/products'),
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),

  // 🏷️ MANAGEMENT CATEGORIES
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),

  //    MANAGEMENT TRANSAKSI ADMIN
  getAdminTransactions: () => api.get('/transactions/admin/dashboard'),
  getAdminReviews: () => api.get('/transactions/admin/reviews'),
};