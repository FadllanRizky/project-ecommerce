import api from './axiosInstance';

// 👤 USER → Ambil loan milik sendiri
export const getMyLoans = (token) => 
  api.get('/loans/me', {
    headers: { ...(token && { Authorization: `Bearer ${token}` }) }
  });

// 👤 USER → Ajukan pinjaman + upload KTP
export const createLoan = (formData, token) =>
  api.post('/loans', formData, {
    headers: { ...(token && { Authorization: `Bearer ${token}` }) }
  });

// 💵 USER → Ambil Data Profil Riil (Untuk Ambil Saldo Dinamis)
export const getUserProfile = (token) =>
  api.get('/auth/me', {  // Sesuaikan dengan endpoint mendapatkan info user/profile kamu
    headers: { ...(token && { Authorization: `Bearer ${token}` }) }
  });

// ⚡ USER → Bayar Cicilan Bulanan Ke Backend
export const payLoanInstallment = (loanId, token) =>
  api.post(`/loans/pay/${loanId}`, {}, {
    headers: { ...(token && { Authorization: `Bearer ${token}` }) }
  });

// 👑 ADMIN → Ambil semua data loan
export const getAllLoansAdmin = (token) => 
  api.get('/admin/loans', {
    headers: { ...(token && { Authorization: `Bearer ${token}` }) }
  });

// 👑 ADMIN → Approve / Reject status pinjaman
export const updateLoanStatusAdmin = (loanId, status, token) =>
  api.put(`/admin/loans/status/${loanId}`, { status }, {
    headers: { ...(token && { Authorization: `Bearer ${token}` }) }
  });