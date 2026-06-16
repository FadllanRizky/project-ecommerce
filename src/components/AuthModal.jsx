import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Mail, Lock, User } from 'lucide-react';
import { loginApi, registerApi } from '../api/authApi';
import Swal from 'sweetalert2';

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, authMode, setAuthMode, login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authMode === 'login') {
        const res = await loginApi({ email, password });
        login(res.data);
      } else {
        await registerApi({ email, password, full_name: fullName });
        
        Swal.fire({
          title: 'Registrasi Sukses!',
          text: 'Akun bos berhasil dibuat + Dapat Saldo Awal Rp 2.000.000! Silakan cek inbox/spam email asli bos untuk konfirmasi.',
          icon: 'success',
          background: '#FFF',
          color: '#374151',
          confirmButtonColor: '#f97316'
        });
        
        setFullName('');
        setAuthMode('login');
      }
    } catch (err) {
      Swal.fire({
        title: 'Gagal',
        text: err.response?.data?.error || err.message || 'Terjadi kesalahan sistem bos',
        icon: 'error',
        background: '#FFF',
        color: '#374151',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-wide uppercase">
              {authMode === 'login' ? 'Masuk Akun Bos' : 'Daftar Member Mbur'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Akses platform transaksi & pinjaman instan.</p>
          </div>
          <button 
            onClick={() => setIsAuthModalOpen(false)} 
            className="p-1.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="Fadllan Rizky"
                  className="w-full bg-white border border-gray-200 focus:border-orange-500 text-gray-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Alamat Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="bos@mbur.com"
                className="w-full bg-white border border-gray-200 focus:border-orange-500 text-gray-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-gray-200 focus:border-orange-500 text-gray-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none transition-all"
              />
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full py-3 mt-2 bg-orange-500 hover:bg-orange-400 disabled:bg-gray-100 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : authMode === 'login' ? 'MASUK SEKARANG' : 'DAFTAR & AMBIL Rp 2JT'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            {authMode === 'login' ? 'Belum punya akun bos?' : 'Sudah terdaftar sebagai member?'}
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-orange-500 font-bold ml-1 hover:underline"
            >
              {authMode === 'login' ? 'Daftar di sini' : 'Login sekarang'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
