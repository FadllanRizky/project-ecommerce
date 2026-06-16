import { createContext, useContext, useState } from 'react';
import Swal from 'sweetalert2';
import axios from 'axios'; // 🔥 WAJIB IMPORT AXIOS BUAT REFRESH DATA USER, BOS!

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 🔥 LANGSUNG AMBIL DI AWAL BIAR REAL-TIME DAN ANTI-DELAY BEGITU RELOAD Halaman
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // ✅ FUNGSI BARU: Sinkronisasi Saldo & Profil User Terbaru ke UI Navbar
  const refreshUser = async (forcedNewBalance = null) => {
    if (!token || !user) return;

    // ⚡ Trik Kilat: Jika dari Checkout dikirim sisa saldo manual, langsung update tanpa nembak API
    if (forcedNewBalance !== null) {
      const updatedData = { ...user, balance: forcedNewBalance };
      localStorage.setItem('user', JSON.stringify(updatedData));
      setUser(updatedData);
      return;
    }

    try {
      // 🔥 Tembak backend port 3000 buat ambil data user paling fresh dari DB Supabase
      // (Sesuaikan jika nama endpoint profile lu berbeda, misal: /api/users/profile)
      const response = await axios.get('http://localhost:3000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const freshUserData = response.data.data || response.data.user || response.data;

      if (freshUserData) {
        localStorage.setItem('user', JSON.stringify(freshUserData));
        setUser(freshUserData);
        console.log("🔄 Saldo global berhasil disinkronkan, Boskuh!");
      }
    } catch (error) {
      console.error("🚨 Gagal auto-refresh data user dari server:", error);
    }
  };

  // ✅ Fungsi Login Otomatis & Fleksibel
  const login = (apiResponseData) => {
    if (!apiResponseData) return;

    let coreData = apiResponseData.data ? apiResponseData.data : apiResponseData;
    
    if (coreData.data && !coreData.user && !coreData.token && !coreData.access_token) {
      coreData = coreData.data;
    }

    const accessToken = coreData.token || coreData.access_token;
    let userData = coreData.user || coreData;

    if (!accessToken) {
      console.error("🚨 Token tidak ditemukan di response API bos!", apiResponseData);
      Swal.fire({
        title: 'Gagal Sinkronisasi',
        text: 'Token autentikasi tidak ditemukan dalam response server.',
        icon: 'error',
        background: '#111827',
        color: '#fff'
      });
      return;
    }

    // Eksekusi simpan ke ekosistem React & Browser LocalStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', accessToken);

    setUser(userData);
    setToken(accessToken);
    setIsAuthModalOpen(false);

    // Force reload secara bersih agar App.jsx membaca ulang state admin terbaru tanpa interupsi
    window.location.reload();
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setToken(null);
    window.location.href = '/'; 
  };

  const checkAuth = () => {
    if (!token) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      return false;
    }
    return true;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      checkAuth, 
      isAuthModalOpen, 
      setIsAuthModalOpen, 
      authMode, 
      setAuthMode,
      refreshUser // 🔥 WAJIB DIEKSPOR BIAR BISA DIPANGGIL DI CHECKOUT.JSX
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);