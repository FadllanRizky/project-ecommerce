import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Shield, Users, ShoppingBag, DollarSign, MessageSquare, 
  Tag, Edit, Trash2, Check, X, Plus, Receipt, Send, 
  User, Wallet, Activity, Key, Truck, Camera, Link as LinkIcon, Star 
} from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../api/axiosInstance';
import { adminService } from '../api/adminApi';
import { shippingRegionApi } from '../api/shippingRegionApi';
import { uploadApi } from '../api/uploadApi';

export default function AdminDashboard() {
  const { user, token, refreshUser } = useAuth();
  const [currentSubTab, setCurrentSubTab] = useState('profile'); // Default langsung diarahkan ke profil admin baru
  const [sidebarOpen, setSidebarOpen] = useState(false); // 🔥 Untuk mobile toggle sidebar
  
  // State Data Utama
  const [allUsers, setAllUsers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [allReviews, setAllReviews] = useState([]); // Inisialisasi aman untuk mencegah crash parse data
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [allShippingRegions, setAllShippingRegions] = useState([]);

  // 🔥 State Baru untuk Input Chat Admin
  const [chatInput, setChatInput] = useState('');

  const loadAdminData = async () => {
    try {
      const [
        resUsers, 
        resProducts, 
        resLoans, 
        resCategories, 
        resChatUsers, 
        resTransactions, 
        resReviews,
        resShippingRegions
      ] = await Promise.all([
        adminService.getUsers().catch(() => ({ data: [] })),
        adminService.getProducts().catch(() => ({ data: [] })),
        adminService.getLoans().catch(() => ({ data: [] })),
        adminService.getCategories().catch(() => ({ data: [] })),
        api.get('/chat/admin/users').catch(() => ({ data: [] })),
        adminService.getAdminTransactions().catch(() => ({ data: [] })), 
        adminService.getAdminReviews().catch(() => ({ data: [] })),
        shippingRegionApi.getAll().catch(() => ({ data: [] }))
      ]);

      const rawUsers = resUsers?.data?.data || resUsers?.data?.users || resUsers?.data || [];
      const rawProducts = resProducts?.data?.data || resProducts?.data?.products || resProducts?.data || [];
      const rawLoans = resLoans?.data?.data || resLoans?.data?.loans || resLoans?.data || [];
      const rawCategories = resCategories?.data?.data || resCategories?.data?.categories || resCategories?.data || [];
      const rawChatUsers = resChatUsers?.data?.data || resChatUsers?.data || [];
      
      // 🔥 PARSING UTK BACKEND EXPRESS: Ambil dari .data.data karena dibungkus { success: true, data: [...] }
      const rawTransactions = resTransactions?.data?.data || resTransactions?.data?.transactions || resTransactions?.data || [];
      const rawReviews = resReviews?.data?.data || resReviews?.data?.reviews || resReviews?.data || [];
      const rawShippingRegions = resShippingRegions?.data?.data || resShippingRegions?.data || [];

      setAllUsers(Array.isArray(rawUsers) ? rawUsers : []);
      setAllProducts(Array.isArray(rawProducts) ? rawProducts : []);
      setAllLoans(Array.isArray(rawLoans) ? rawLoans : []);
      setAllCategories(Array.isArray(rawCategories) ? rawCategories : []);
      setChatUsers(Array.isArray(rawChatUsers) ? rawChatUsers : []);
      setAllTransactions(Array.isArray(rawTransactions) ? rawTransactions : []);
      setAllReviews(Array.isArray(rawReviews) ? rawReviews : []);
      setAllShippingRegions(Array.isArray(rawShippingRegions) ? rawShippingRegions : []);

    } catch (err) {
      // Konsol tetap bersih dari unhandled log
    }
  };  

  useEffect(() => {
    loadAdminData();
    const interval = setInterval(loadAdminData, 5000);
    return () => clearInterval(interval);
  }, []);

  // ==================== 💬 HANDLER KIRIM CHAT ADMIN ====================
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !selectedChatUser) return;

    try {
      // Mengirim chat balasan admin ke backend/Supabase
      await api.post('/chat/admin/send', {
        target_user_id: selectedChatUser,
        message: chatInput.trim()
      });

      setChatInput('');
      loadAdminData();
      fetchChatMessages(selectedChatUser);
    } catch (err) {
      Swal.fire({ title: 'Gagal', text: 'Gagal mengirim pesan, periksa route /chat/admin/send lu bos!', icon: 'error', background: '#111827', color: '#fff' });
    }
  };

  // ==================== 👥 HANDLER CRUD USERS ====================
  const handleEditUser = (u) => {
    Swal.fire({
      title: `Ubah Parameter: ${u.full_name || u.email}`,
      html: `
        <div class="flex flex-col gap-2 text-left font-sans">
          <label class="text-xs text-slate-400">Saldo Dompet (Rp)</label>
          <input id="swal-balance" type="number" class="swal2-input m-0! w-full! bg-gray-50 text-gray-800 border-slate-700" value="${u.balance || 0}">
          <label class="text-xs text-slate-400 mt-2">Limit Maksimal Pinjaman (Rp)</label>
          <input id="swal-limit" type="number" class="swal2-input m-0! w-full! bg-gray-50 text-gray-800 border-slate-700" value="${u.loan_limit || 0}">
        </div>
      `,
      background: '#111827', color: '#fff', confirmButtonColor: '#06b6d4', showCancelButton: true,
      preConfirm: () => ({
        balance: Number(document.getElementById('swal-balance').value),
        loan_limit: Number(document.getElementById('swal-limit').value)
      })
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await adminService.updateUser(u.id, result.value);
          Swal.fire({ title: 'Berhasil!', text: 'Profil keuangan user diperbarui.', icon: 'success', background: '#111827', color: '#fff' });
          loadAdminData();
        } catch { Swal.fire('Gagal!', 'Terjadi gangguan sistem.', 'error'); }
      }
    });
  };

  const handleDeleteUser = (id) => {
    Swal.fire({
      title: 'Depak User?', text: "User akan ditiadakan permanen!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', background: '#111827', color: '#fff'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try { await adminService.deleteUser(id); loadAdminData(); } catch { Swal.fire('Gagal!', 'Gagal menghapus user.', 'error'); }
      }
    });
  };

  // ==================== 📦 HANDLER CRUD PRODUCTS ====================
  const handleAddProduct = () => {
    const categoryOptions = allCategories
      .map(c => `<option value="${c.id}">${c.name}</option>`)
      .join('');

    Swal.fire({
      title: 'Tambah Produk Baru',
      html: `
        <div class="flex flex-col gap-2 text-left font-sans">
          <label class="text-xs text-slate-400">Kategori Produk</label>
          <select id="p-category" class="swal2-input m-0! w-full! bg-gray-50 text-gray-800 border-slate-700">
            <option value="">-- Pilih Kategori --</option>
            ${categoryOptions}
          </select>
          <label class="text-xs text-slate-400 mt-2">Nama Produk</label>
          <input id="p-name" class="swal2-input m-0! w-full! bg-gray-50 text-gray-800 border-slate-700" placeholder="Contoh: Asus ROG Zephyrus">
          <label class="text-xs text-slate-400 mt-2">Slug URL (Otomatis jika kosong)</label>
          <input id="p-slug" class="swal2-input m-0! w-full! bg-gray-50 text-gray-800 border-slate-700" placeholder="contoh: asus-rog-zephyrus">
          <label class="text-xs text-slate-400 mt-2">Merek / Brand</label>
          <input id="p-brand" class="swal2-input m-0! w-full! bg-gray-50 text-gray-800 border-slate-700" placeholder="Contoh: ASUS">
          <div class="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label class="text-xs text-slate-400">Harga (Rp)</label>
              <input id="p-price" type="number" class="swal2-input m-0! w-full! bg-gray-50 text-gray-800 border-slate-700" placeholder="0">
            </div>
            <div>
              <label class="text-xs text-slate-400">Jumlah Stok</label>
              <input id="p-stok" type="number" class="swal2-input m-0! w-full! bg-gray-50 text-gray-800 border-slate-700" placeholder="0">
            </div>
          </div>
          <label class="text-xs text-slate-400 mt-2">URL Gambar Produk</label>
          <input id="p-img" class="swal2-input m-0! w-full! bg-gray-50 text-gray-800 border-slate-700" placeholder="https://...">
          <label class="text-xs text-slate-400 mt-2">Deskripsi Keterangan</label>
          <textarea id="p-desc" class="swal2-input m-0! w-full! bg-gray-50 text-gray-800 border-slate-700 h-20! p-2" placeholder="Spesifikasi produk..."></textarea>
        </div>
      `,
      background: '#111827', color: '#fff', confirmButtonColor: '#10b981', showCancelButton: true,
      preConfirm: () => {
        const nameVal = document.getElementById('p-name').value;
        const slugVal = document.getElementById('p-slug').value;
        const priceVal = Number(document.getElementById('p-price').value || 0);
        if (priceVal <= 0) {
          Swal.showValidationMessage('Harga produk harus lebih dari 0, bos!');
          return false;
        }
        return {
          category_id: document.getElementById('p-category').value || null,
          name: nameVal,
          slug: slugVal || nameVal.toLowerCase().trim().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-'),
          brand: document.getElementById('p-brand').value,
          price: priceVal,
          stok: Number(document.getElementById('p-stok').value || 0),
          image_url: document.getElementById('p-img').value,
          description: document.getElementById('p-desc').value
        };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await adminService.createProduct(result.value);
          Swal.fire({ title: 'Sukses!', text: 'Produk berhasil masuk katalog.', icon: 'success', background: '#111827', color: '#fff' });
          loadAdminData();
        } catch (err) { Swal.fire('Gagal!', 'Periksa hak akses RLS atau input data Anda.', 'error'); }
      }
    });
  };

  const handleEditProduct = (p) => {
    const categoryOptions = allCategories
      .map(c => `<option value="${c.id}" ${c.id === p.category_id ? 'selected' : ''}>${c.name}</option>`)
      .join('');

    Swal.fire({
      title: 'Ubah Data Produk',
      html: `
        <div class="flex flex-col gap-2 text-left font-sans">
          <label class="text-xs text-slate-400">Kategori Produk</label>
          <select id="p-category" class="swal2-input m-0! w-full! bg-gray-50 text-gray-800 border-slate-700">
            <option value="">-- Pilih Kategori --</option>
            ${categoryOptions}
          </select>
          <label class="text-xs text-slate-400 mt-2">Nama Produk</label>
          <input id="p-name" class="swal2-input m-0! w-full! bg-gray-50 text-gray-800 border-slate-700" value="${p.name || ''}">
          <label class="text-xs text-slate-400 mt-2">Slug URL</label>
          <input id="p-slug" class="swal2-input m-0! w-full! bg-gray-50 text-gray-800 border-slate-700" value="${p.slug || ''}">
          <label class="text-xs text-slate-400 mt-2">Merek / Brand</label>
          <input id="p-brand" class="swal2-input m-0! w-full! bg-gray-50 text-gray-800 border-slate-700" value="${p.brand || ''}">
          <div class="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label class="text-xs text-slate-400">Harga (Rp)</label>
              <input id="p-price" type="number" class="swal2-input m-0! w-full! bg-gray-50 text-gray-800 border-slate-700" value="${p.price || 0}">
            </div>
            <div>
              <label class="text-xs text-slate-400">Jumlah Stok</label>
              <input id="p-stok" type="number" class="swal2-input m-0! w-full! bg-gray-50 text-gray-800 border-slate-700" value="${p.stok || p.stock || 0}">
            </div>
          </div>
          <label class="text-xs text-slate-400 mt-2">URL Gambar Produk</label>
          <input id="p-img" class="swal2-input m-0! w-full! bg-gray-50 text-gray-800 border-slate-700" value="${p.image_url || ''}">
          <label class="text-xs text-slate-400 mt-2">Deskripsi Keterangan</label>
          <textarea id="p-desc" class="swal2-input m-0! w-full! bg-gray-50 text-gray-800 border-slate-700 h-20! p-2">${p.description || ''}</textarea>
        </div>
      `,
      background: '#111827', color: '#fff', showCancelButton: true,
      preConfirm: () => {
        const priceVal = Number(document.getElementById('p-price').value || 0);
        if (priceVal <= 0) {
          Swal.showValidationMessage('Harga produk harus lebih dari 0, bos!');
          return false;
        }
        return {
          category_id: document.getElementById('p-category').value || null,
          name: document.getElementById('p-name').value,
          slug: document.getElementById('p-slug').value,
          brand: document.getElementById('p-brand').value,
          price: priceVal,
          stok: Number(document.getElementById('p-stok').value || 0),
          image_url: document.getElementById('p-img').value,
          description: document.getElementById('p-desc').value
        };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await adminService.updateProduct(p.id, result.value);
          Swal.fire({ title: 'Diperbarui!', text: 'Data komoditas barang aman.', icon: 'success', background: '#111827', color: '#fff' });
          loadAdminData();
        } catch (err) { Swal.fire('Gagal Update!', 'Pastikan skema payload sesuai database.', 'error'); }
      }
    });
  };

  const handleDeleteProduct = (id) => {
    Swal.fire({
      title: 'Hapus Produk?', text: "Produk ditarik dari peredaran toko!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', background: '#111827', color: '#fff'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try { await adminService.deleteProduct(id); loadAdminData(); } catch { Swal.fire('Gagal!', 'Gagal memusnahkan produk.', 'error'); }
      }
    });
  };

  // ==================== 🏷️ HANDLER CRUD CATEGORIES ====================
  const handleAddCategory = () => {
    Swal.fire({
      title: 'Tambah Kategori Baru',
      html: `
        <input id="c-name" class="swal2-input bg-gray-50 text-gray-800" placeholder="Nama Kategori">
        <input id="c-slug" class="swal2-input bg-gray-50 text-gray-800" placeholder="Slug (Contoh: gadget-elektronik)">
      `,
      background: '#111827', color: '#fff', confirmButtonColor: '#10b981', showCancelButton: true,
      preConfirm: () => ({
        name: document.getElementById('c-name').value,
        slug: document.getElementById('c-slug').value
      })
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await adminService.createCategory(result.value);
          Swal.fire({ title: 'Kategori Ditambah!', icon: 'success', background: '#111827', color: '#fff' });
          loadAdminData();
        } catch (err) { Swal.fire('Gagal!', 'Harap aktifkan kebijakan INSERT policy di Supabase.', 'error'); }
      }
    });
  };

  const handleEditCategory = (c) => {
    Swal.fire({
      title: 'Ubah Data Kategori',
      html: `
        <input id="c-name" class="swal2-input bg-gray-50 text-gray-800" value="${c.name}">
        <input id="c-slug" class="swal2-input bg-gray-50 text-gray-800" value="${c.slug}">
      `,
      background: '#111827', color: '#fff', showCancelButton: true,
      preConfirm: () => ({
        name: document.getElementById('c-name').value,
        slug: document.getElementById('c-slug').value
      })
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await adminService.updateCategory(c.id, result.value);
          Swal.fire({ title: 'Sukses!', text: 'Kategori berhasil diubah', icon: 'success', background: '#111827', color: '#fff' });
          loadAdminData();
        } catch { Swal.fire('Gagal!', 'Gagal update data kategori.', 'error'); }
      }
    });
  };

  const handleDeleteCategory = (id) => {
    Swal.fire({
      title: 'Babat Kategori?', text: "Seluruh relasi komoditas akan terputus!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', background: '#111827', color: '#fff'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try { await adminService.deleteCategory(id); loadAdminData(); } catch { Swal.fire('Gagal!', 'Gagal menghapus kategori.', 'error'); }
      }
    });
  };

  // ==================== 💰 HANDLER APPROVAL LOANS ====================
  const handleProcessLoan = async (id, status) => {
    try {
      const res = status === 'approved' ? await adminService.approveLoan(id) : await adminService.rejectLoan(id);
      Swal.fire({ title: 'Berhasil!', text: res?.data?.message || 'Aksi Berhasil!', icon: 'success', background: '#111827', color: '#fff' });
      loadAdminData();
      if (refreshUser) refreshUser();
    } catch (err) {
      Swal.fire('Gagal!', err.response?.data?.error || 'Aksi ditolak sistem.', 'error');
    }
  };

  // ==================== 🚚 HANDLER CRUD SHIPPING REGIONS ====================
  const handleAddRegion = () => {
    Swal.fire({
      title: 'Tambah Wilayah Pengiriman',
      html: `
        <div class="flex flex-col gap-2 text-left font-sans">
          <label class="text-xs text-slate-400">Nama Wilayah</label>
          <input id="r-name" class="swal2-input m-0! w-full! bg-gray-50 text-gray-800 border-slate-700" placeholder="Contoh: Kalimantan">
          <label class="text-xs text-slate-400 mt-2">Estimasi Pengiriman</label>
          <input id="r-est" class="swal2-input m-0! w-full! bg-gray-50 text-gray-800 border-slate-700" placeholder="Contoh: 6-8 Hari">
        </div>
      `,
      background: '#111827', color: '#fff', confirmButtonColor: '#10b981', showCancelButton: true,
      preConfirm: () => ({
        name: document.getElementById('r-name').value,
        estimated_delivery: document.getElementById('r-est').value
      })
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await shippingRegionApi.create(result.value, token);
          Swal.fire({ title: 'Wilayah Ditambahkan!', icon: 'success', background: '#111827', color: '#fff' });
          loadAdminData();
        } catch (err) { Swal.fire('Gagal!', err.response?.data?.error || 'Gagal menambah wilayah', 'error'); }
      }
    });
  };

  const handleEditRegion = (r) => {
    Swal.fire({
      title: 'Ubah Wilayah Pengiriman',
      html: `
        <div class="flex flex-col gap-2 text-left font-sans">
          <label class="text-xs text-slate-400">Nama Wilayah</label>
          <input id="r-name" class="swal2-input m-0! w-full! bg-gray-50 text-gray-800 border-slate-700" value="${r.name}">
          <label class="text-xs text-slate-400 mt-2">Estimasi Pengiriman</label>
          <input id="r-est" class="swal2-input m-0! w-full! bg-gray-50 text-gray-800 border-slate-700" value="${r.estimated_delivery}">
        </div>
      `,
      background: '#111827', color: '#fff', showCancelButton: true,
      preConfirm: () => ({
        name: document.getElementById('r-name').value,
        estimated_delivery: document.getElementById('r-est').value
      })
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await shippingRegionApi.update(r.id, result.value, token);
          Swal.fire({ title: 'Diperbarui!', text: 'Data wilayah berhasil diubah.', icon: 'success', background: '#111827', color: '#fff' });
          loadAdminData();
        } catch (err) { Swal.fire('Gagal!', err.response?.data?.error || 'Gagal update wilayah', 'error'); }
      }
    });
  };

  const handleDeleteRegion = (id) => {
    Swal.fire({
      title: 'Hapus Wilayah?', text: "Wilayah pengiriman akan dihapus permanen!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', background: '#111827', color: '#fff'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try { await shippingRegionApi.remove(id, token); loadAdminData(); } catch { Swal.fire('Gagal!', 'Gagal menghapus wilayah.', 'error'); }
      }
    });
  };

  // ==================== 💬 INTERAKSI CHAT HANDLER ====================
  const openChatWithUser = (userId) => {
    setSelectedChatUser(userId);
    setChatMessages([]);
    window.dispatchEvent(new CustomEvent('trigger-mbur-chat', { detail: { targetUser: userId } }));
  };

  const closeChatWithUser = () => {
    setSelectedChatUser(null);
    setChatMessages([]);
    window.dispatchEvent(new CustomEvent('trigger-mbur-chat', { detail: { targetUser: null } }));
    window.dispatchEvent(new CustomEvent('close-mbur-chat'));
    Swal.fire({ title: 'Room Chat Ditutup', text: 'Koneksi dilepas.', icon: 'info', timer: 800, showConfirmButton: false, background: '#111827', color: '#fff' });
  };

  const fetchChatMessages = async (userId) => {
    if (!userId) return;
    try {
      const res = await api.get('/chat', { params: { target_user: userId } });
      const msgs = res.data?.data || res.data || [];
      setChatMessages(Array.isArray(msgs) ? msgs : []);
    } catch (err) {
      console.error('Gagal fetch chat messages:', err);
    }
  };

  useEffect(() => {
    if (!selectedChatUser) return;
    fetchChatMessages(selectedChatUser);
    const interval = setInterval(() => fetchChatMessages(selectedChatUser), 3000);
    return () => clearInterval(interval);
  }, [selectedChatUser]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[80vh] font-sans antialiased text-gray-700">

      {/* 🔥 MOBILE HAMBURGER TOGGLE */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 mb-2 w-full"
      >
        <div className="space-y-1">
          <span className="block w-5 h-0.5 bg-gray-600"></span>
          <span className="block w-5 h-0.5 bg-gray-600"></span>
          <span className="block w-5 h-0.5 bg-gray-600"></span>
        </div>
        Menu Navigasi
      </button>

      {/* SIDEBAR NAVIGATION */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 bg-white border border-gray-200 rounded-2xl p-4 space-y-1 flex flex-col justify-between`}>
        <div className="space-y-2">
          <div className="p-3 bg-white border border-gray-200/80 rounded-xl mb-4 flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400"><Shield size={18} /></div>
            <div>
              <h2 className="text-xs font-black tracking-wider text-white uppercase">MODE KONTROL</h2>
              <p className="text-[10px] text-slate-400 font-medium">@{user?.full_name || 'Admin Mbur'}</p>
            </div>
          </div>

          {/* 🔥 MENU BARU: PROFIL & BIODATA ADMIN */}
          <button onClick={() => { setCurrentSubTab('profile'); setSidebarOpen(false); }} className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${currentSubTab === 'profile' ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/10' : 'hover:bg-slate-800 text-slate-400'}`}>
            <User size={16} /> Profil & Saldo Admin
          </button>

          <button onClick={() => { setCurrentSubTab('loans'); setSidebarOpen(false); }} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${currentSubTab === 'loans' ? 'bg-cyan-500 text-white' : 'hover:bg-slate-800 text-slate-400'}`}>
            <span className="flex items-center gap-2"><DollarSign size={16} /> Approval Kredit</span>
            {allLoans.filter(l => l?.status === 'pending').length > 0 && (
              <span className="bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-md text-[9px] font-black">
                {allLoans.filter(l => l?.status === 'pending').length}
              </span>
            )}
          </button>

          <button onClick={() => { setCurrentSubTab('purchases'); setSidebarOpen(false); }} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${currentSubTab === 'purchases' ? 'bg-cyan-500 text-white' : 'hover:bg-slate-800 text-slate-400'}`}>
            <span className="flex items-center gap-2"><Receipt size={16} /> Notif Pembelian</span>
            {allTransactions.length > 0 && (
              <span className="bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded-md text-[9px] font-black">
                {allTransactions.length}
              </span>
            )}
          </button>

          <button onClick={() => { setCurrentSubTab('users'); setSidebarOpen(false); }} className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${currentSubTab === 'users' ? 'bg-cyan-500 text-white' : 'hover:bg-slate-800 text-slate-400'}`}>
            <Users size={16} /> Manajemen Users
          </button>

          <button onClick={() => { setCurrentSubTab('products'); setSidebarOpen(false); }} className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${currentSubTab === 'products' ? 'bg-cyan-500 text-white' : 'hover:bg-slate-800 text-slate-400'}`}>
            <ShoppingBag size={16} /> Manajemen Produk
          </button>

          <button onClick={() => { setCurrentSubTab('categories'); setSidebarOpen(false); }} className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${currentSubTab === 'categories' ? 'bg-cyan-500 text-white' : 'hover:bg-slate-800 text-slate-400'}`}>
            <Tag size={16} /> Manajemen Kategori
          </button>

          <button onClick={() => { setCurrentSubTab('shipping'); setSidebarOpen(false); }} className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${currentSubTab === 'shipping' ? 'bg-cyan-500 text-white' : 'hover:bg-slate-800 text-slate-400'}`}>
            <Truck size={16} /> Wilayah Pengiriman
          </button>

          <button onClick={() => { setCurrentSubTab('reviews'); setSidebarOpen(false); }} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${currentSubTab === 'reviews' ? 'bg-cyan-500 text-white' : 'hover:bg-slate-800 text-slate-400'}`}>
            <span className="flex items-center gap-2"><Star size={16} /> Ulasan Bintang</span>
            {allReviews.length > 0 && <span className="bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-md text-[9px] font-black">{allReviews.length}</span>}
          </button>

          <button onClick={() => { setCurrentSubTab('chat'); setSidebarOpen(false); }} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${currentSubTab === 'chat' ? 'bg-cyan-500 text-white' : 'hover:bg-slate-800 text-slate-400'}`}>
            <span className="flex items-center gap-2"><MessageSquare size={16} /> Hub Chat Masuk</span>
            {chatUsers.length > 0 && <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-md text-[9px] font-black animate-pulse">{chatUsers.length}</span>}
          </button>
        </div>
      </div>

      {/* RIGHT BOARD CONTENT */}
      <div className="flex-1 bg-white/30 border border-gray-200/50 rounded-2xl p-3 lg:p-6 backdrop-blur-sm overflow-hidden">

        {/* 🔥 TAMPILAN BARU: UI BIODATA PROFILE & SALDO ADMIN */}
        {currentSubTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" /> BIODATA PERWIRA ADMIN
              </h2>
              <p className="text-xs text-slate-400">Parameter otoritas data, identitas personal, dan log keuangan operasional sistem.</p>
            </div>

            {/* Grid Atas: Info Utama & Saldo */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Card Biodata Utama */}
              <div className="lg:col-span-2 bg-white/60 border border-gray-200 p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                  <Shield size={160} className="text-white" />
                </div>
                <div className="relative group shrink-0">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="avatar"
                      className="w-20 h-20 rounded-2xl object-cover border border-cyan-500/30"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  <div className={`w-20 h-20 bg-linear-to-tr from-cyan-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-cyan-950/50 shrink-0 border border-cyan-500/30 ${user?.avatar_url ? 'hidden' : ''}`}>
                    {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'AM'}
                  </div>
                  <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => document.getElementById('admin-avatar-input')?.click()}>
                    <Camera size={22} className="text-white" />
                  </div>
                  <input id="admin-avatar-input" type="file" accept="image/*" className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const res = await uploadApi.uploadAvatar(file);
                        if (res?.avatar_url) {
                          const updatedUser = { ...user, avatar_url: res.avatar_url };
                          localStorage.setItem('user', JSON.stringify(updatedUser));
                          window.location.reload();
                        }
                      } catch (err) {
                        Swal.fire({ title: 'Gagal!', text: err.response?.data?.error || 'Gagal upload avatar', icon: 'error', background: '#111827', color: '#fff' });
                      }
                    }}
                  />
                </div>
                <div className="text-center sm:text-left space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <h3 className="text-base font-black text-white uppercase tracking-wide">{user?.full_name || 'Admin Mbur'}</h3>
                    <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded text-[9px] font-mono font-bold uppercase tracking-wider">SYSTEM OVERSEER</span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">{user?.email || 'admin@mbur.com'}</p>
                  <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-4 text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><Key size={12} className="text-slate-600" /> ID: {user?.id?.substring(0, 8) || 'SYSTEM-UUID'}...</span>
                    <span className="flex items-center gap-1"><Activity size={12} className="text-emerald-500" /> Status: Active Session</span>
                  </div>
                </div>
              </div>

              {/* Card Saldo Admin */}
              <div className="bg-linear-to-br from-slate-900 to-slate-950 border border-gray-200 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 p-4 text-emerald-500/10 pointer-events-none">
                  <Wallet size={80} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase block">SALDO OPERASIONAL</span>
                  {/* Di sini saldo admin diambil dari user.balance jika ada, atau di-default agar UI premium */}
                  <h2 className="text-2xl font-black text-emerald-400 tracking-tight">
                    Rp {Number(user?.balance || 500000000).toLocaleString('id-ID')}
                  </h2>
                </div>
                <div className="pt-4 border-t border-gray-200/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-medium">Otoritas Kas Likuid</span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono">SECURE</span>
                </div>
              </div>
            </div>

            {/* Grid Bawah: Rincian Spesifikasi & Ringkasan Data Kontrol */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Detail Info Tambahan */}
              <div className="md:col-span-2 bg-white/40 border border-gray-200/80 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-black tracking-wider text-slate-400 uppercase">Spesifikasi Hak Akses & Enkripsi</h4>
                <div className="divide-y divide-slate-800/60 text-xs">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Tingkat Penjagaan</span>
                    <span className="text-slate-300 font-mono font-bold">Level 1 Secure Shield (Root)</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Metode Autentikasi</span>
                    <span className="text-slate-300 font-mono text-[11px]">JWT Node Express Session</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Sinkronisasi Database</span>
                    <span className="text-cyan-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" /> Realtime API Supabase
                    </span>
                  </div>
                </div>
              </div>

              {/* Ringkasan Data yang Dikelola Saat Ini */}
              <div className="bg-white/40 border border-gray-200/80 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                <h4 className="text-xs font-black tracking-wider text-slate-400 uppercase">Ringkasan Sistem</h4>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 bg-slate-950/40 border border-gray-200/60 rounded-xl">
                    <div className="text-base font-black text-white font-mono">{allUsers.length}</div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Nasabah</div>
                  </div>
                  <div className="p-2.5 bg-slate-950/40 border border-gray-200/60 rounded-xl">
                    <div className="text-base font-black text-white font-mono">{allProducts.length}</div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Produk</div>
                  </div>
                  <div className="p-2.5 bg-slate-950/40 border border-gray-200/60 rounded-xl">
                    <div className="text-base font-black text-cyan-400 font-mono">{allLoans.filter(l => l.status === 'pending').length}</div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Pending ACC</div>
                  </div>
                  <div className="p-2.5 bg-slate-950/40 border border-gray-200/60 rounded-xl">
                    <div className="text-base font-black text-emerald-400 font-mono">{allTransactions.length}</div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Penjualan</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LOANS TAB */}
        {currentSubTab === 'loans' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h2 className="text-lg font-black text-white uppercase">ACC Lembar Komitmen Dana Kredit</h2>
            <div className="overflow-x-auto border border-gray-200 rounded-xl bg-slate-950/20">
              <table className="w-full text-left text-xs">
                <thead className="bg-white border-b border-gray-200 text-slate-400 font-bold uppercase">
                  <tr>
                    <th className="p-3.5">Peminjam</th>
                    <th className="p-3.5">No Telepon / NIK</th>
                    <th className="p-3.5">Jumlah Dana</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {allLoans.length === 0 ? (
                    <tr><td colSpan="5" className="p-4 text-center text-slate-500">Belum ada berkas pinjaman masuk.</td></tr>
                  ) : (
                    allLoans.map(l => (
                      <tr key={l.id} className="hover:bg-white/20">
                        <td className="p-3.5 font-bold text-white">
                          <div className="font-bold">{l.full_name_applicant || l.users?.full_name || 'User Tanpa Nama'}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{l.users?.email || l.email || ''}</div>
                        </td>
                        <td className="p-3.5 text-slate-400 font-mono">
                          <div>Telp: {l.phone_number || '-'}</div>
                          <div className="text-[10px] text-slate-500">NIK: {l.nik || '-'}</div>
                        </td>
                        <td className="p-3.5 font-black text-cyan-400">Rp {Number(l.loan_amount || l.amount || 0).toLocaleString('id-ID')}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${l.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                            l.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                            }`}>{l.status}</span>
                        </td>
                        <td className="p-3.5 text-right">
                          {l.status === 'pending' ? (
                            <div className="flex justify-end gap-1.5">
                              <button onClick={() => handleProcessLoan(l.id, 'approved')} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black rounded-lg flex items-center gap-0.5 transition-colors">
                                <Check size={11} /> ACC
                              </button>
                              <button onClick={() => handleProcessLoan(l.id, 'rejected')} className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black rounded-lg flex items-center gap-0.5 transition-colors">
                                <X size={11} /> REJECT
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-medium">Selesai</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* NOTIFIKASI PEMBELIAN */}
        {currentSubTab === 'purchases' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Notifikasi Aktivitas Belanja Nasabah</h2>
            <div className="overflow-x-auto border border-gray-200 rounded-xl bg-slate-950/20">
              <table className="w-full text-left text-xs">
                <thead className="bg-white border-b border-gray-200 text-slate-400 font-bold uppercase">
                  <tr>
                    <th className="p-3.5">Pembeli</th>
                    <th className="p-3.5">Item Produk</th>
                    <th className="p-3.5">Total Pengeluaran</th>
                    <th className="p-3.5">Wilayah</th>
                    <th className="p-3.5">Estimasi Tiba</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {allTransactions.length === 0 ? (
                    <tr><td colSpan="6" className="p-4 text-center text-slate-500">Belum ada data pembelian terdeteksi dari sistem.</td></tr>
                  ) : (
                    allTransactions.map((t, index) => {
                      const arrivalDate = t.estimated_arrival_date 
                        ? new Date(t.estimated_arrival_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                        : t.estimated_delivery || '-';
                      return (
                      <tr key={t.id || index} className="hover:bg-white/20">
                        <td className="p-3.5">
                          <div className="font-bold text-white">{t.users?.full_name || t.full_name || 'Anonymous User'}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{t.users?.email || t.email || ''}</div>
                        </td>
                        <td className="p-3.5 text-slate-300 font-medium uppercase tracking-tight">
                          {t.transaction_items?.map(i => i.products?.name).filter(Boolean).join(', ') || t.products?.name || t.product_name || 'Item Komoditas Mbur'}
                        </td>
                        <td className="p-3.5 font-black text-emerald-400">
                          Rp {Number(t.amount || t.total_amount || t.price || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="p-3.5 text-slate-400 text-[10px]">
                          <span className="font-medium">{t.shipping_region || '-'}</span>
                        </td>
                        <td className="p-3.5 text-slate-400 text-[10px] font-mono">
                          {arrivalDate}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            t.status === 'completed' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : t.status === 'shipping'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {t.status === 'completed' ? 'SELESAI' : t.status === 'shipping' ? 'DALAM PERJALANAN' : 'PROSES'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {currentSubTab === 'users' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Kelola Akun Nasabah</h2>
            <div className="overflow-x-auto border border-gray-200 rounded-xl bg-slate-950/20">
              <table className="w-full text-left text-xs">
                <thead className="bg-white border-b border-gray-200 text-slate-400 font-bold uppercase">
                  <tr>
                    <th className="p-3.5">Nama User</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Hak Akses</th>
                    <th className="p-3.5">Saldo</th>
                    <th className="p-3.5 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {allUsers.map(u => (
                    <tr key={u.id} className="hover:bg-white/20">
                      <td className="p-3.5 font-bold text-white">{u.full_name || 'No Name'}</td>
                      <td className="p-3.5 text-slate-400 font-mono">{u.email}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${u.role === 'admin' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-800 text-slate-300'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5 text-emerald-400 font-black">Rp {Number(u.balance || 0).toLocaleString('id-ID')}</td>
                      <td className="p-3.5 flex justify-center gap-1">
                        <button onClick={() => handleEditUser(u)} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"><Edit size={13} /></button>
                        <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg"><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {currentSubTab === 'products' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-white uppercase">Etalase Inventori Barang</h2>
              <button onClick={handleAddProduct} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all">
                <Plus size={14} /> TAMBAH PRODUK
              </button>
            </div>
            <div className="overflow-x-auto border border-gray-200 rounded-xl bg-slate-950/20">
              <table className="w-full text-left text-xs">
                <thead className="bg-white border-b border-gray-200 text-slate-400 font-bold uppercase">
                  <tr>
                    <th className="p-3.5">Nama Produk</th>
                    <th className="p-3.5">Harga</th>
                    <th className="p-3.5">Stok Sisa</th>
                    <th className="p-3.5 text-center">Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {allProducts.map(p => (
                    <tr key={p.id} className="hover:bg-white/20">
                      <td className="p-3.5 font-bold text-white flex items-center gap-3">
                        {p.image_url && <img src={p.image_url} alt="" className="w-7 h-7 object-cover rounded-lg bg-slate-800" />}
                        <span>{p.name}</span>
                      </td>
                      <td className="p-3.5 text-slate-300 font-bold">Rp {Number(p.price || 0).toLocaleString('id-ID')}</td>
                      <td className="p-3.5 font-mono text-slate-400">{p.stock || p.stok || 0} unit</td>
                      <td className="p-3.5 flex justify-center gap-1">
                        <button onClick={() => handleEditProduct(p)} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"><Edit size={13} /></button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg"><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {currentSubTab === 'categories' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-white uppercase">Kategori Klasifikasi Komoditas</h2>
              <button onClick={handleAddCategory} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all">
                <Plus size={14} /> TAMBAH KATEGORI
              </button>
            </div>
            <div className="overflow-x-auto border border-gray-200 rounded-xl bg-slate-950/20">
              <table className="w-full text-left text-xs">
                <thead className="bg-white border-b border-gray-200 text-slate-400 font-bold uppercase">
                  <tr>
                    <th className="p-3.5">Nama Kategori</th>
                    <th className="p-3.5">Slug Parameter</th>
                    <th className="p-3.5 text-center">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {allCategories.length === 0 ? (
                    <tr><td colSpan="3" className="p-4 text-center text-slate-500">Belum ada kategori yang dikonfigurasi.</td></tr>
                  ) : (
                    allCategories.map(c => (
                      <tr key={c.id || c.slug} className="hover:bg-white/20">
                        <td className="p-3.5 font-bold text-white uppercase tracking-tight">{c.name}</td>
                        <td className="p-3.5 text-slate-400 font-mono">{c.slug}</td>
                        <td className="p-3.5 flex justify-center gap-1">
                          <button onClick={() => handleEditCategory(c)} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"><Edit size={13} /></button>
                          <button onClick={() => handleDeleteCategory(c.id)} className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg"><Trash2 size={13} /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 🚚 SHIPPING REGIONS TAB */}
        {currentSubTab === 'shipping' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-white uppercase">Manajemen Wilayah & Estimasi Pengiriman</h2>
              <button onClick={handleAddRegion} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all">
                <Plus size={14} /> TAMBAH WILAYAH
              </button>
            </div>
            <div className="overflow-x-auto border border-gray-200 rounded-xl bg-slate-950/20">
              <table className="w-full text-left text-xs">
                <thead className="bg-white border-b border-gray-200 text-slate-400 font-bold uppercase">
                  <tr>
                    <th className="p-3.5">Nama Wilayah</th>
                    <th className="p-3.5">Estimasi Tiba</th>
                    <th className="p-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {allShippingRegions.length === 0 ? (
                    <tr><td colSpan="3" className="p-4 text-center text-slate-500">Belum ada data wilayah pengiriman.</td></tr>
                  ) : (
                    allShippingRegions.map(r => (
                      <tr key={r.id} className="hover:bg-white/20">
                        <td className="p-3.5 font-bold text-white">{r.name}</td>
                        <td className="p-3.5 text-cyan-400 font-black">{r.estimated_delivery}</td>
                        <td className="p-3.5 flex justify-center gap-1">
                          <button onClick={() => handleEditRegion(r)} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"><Edit size={13} /></button>
                          <button onClick={() => handleDeleteRegion(r.id)} className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg"><Trash2 size={13} /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* HUB CHAT TAB WITH PREMIUM SPLIT-SCREEN LAYOUT */}
        {currentSubTab === 'chat' && (
          <div className="space-y-4 animate-in fade-in duration-300 max-w-5xl mx-auto text-slate-200">
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" /> HUB CHAT CUSTOMER MASUK
              </h2>
              <p className="text-xs text-slate-400">Notifikasi interaksi pertanyaan spesifikasi produk dari customer.</p>
            </div>

            <div className={`grid gap-4 ${selectedChatUser ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'} lg:h-145 items-stretch`}>

              {/* ==================== KOLOM KIRI: Daftar Antrean Chat User ==================== */}
              <div className={`${selectedChatUser ? 'lg:col-span-1' : 'w-full'} flex flex-col bg-white/40 border border-gray-200/80 rounded-2xl p-3 h-full`}>
                <span className="text-[10px] font-black tracking-wider text-slate-500 uppercase mb-2 px-1 block">
                  Antrean Pesan ({chatUsers.length})
                </span>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-75 lg:max-h-full">
                  {chatUsers.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl text-xs text-slate-500 bg-slate-950/20">
                      Belum ada pesan baru masuk.
                    </div>
                  ) : (
                    chatUsers.map(cu => (
                      <div
                        key={cu.id}
                        className={`p-3 border rounded-xl flex justify-between items-center bg-white/60 transition-all ${selectedChatUser === cu.id
                          ? 'border-cyan-500 bg-cyan-950/20 shadow-lg shadow-cyan-950/10'
                          : 'border-gray-200/80 hover:border-slate-700 hover:bg-white'
                          }`}
                      >
                        <div className="overflow-hidden truncate mr-2 flex-1">
                          <h4 className="text-xs font-black text-white uppercase tracking-tight truncate">
                            {cu.full_name || 'Customer'}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate font-mono">{cu.email}</p>
                        </div>

                        {selectedChatUser === cu.id ? (
                          <button
                            onClick={closeChatWithUser}
                            className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 text-rose-400 hover:text-white text-[10px] font-black rounded-lg flex items-center gap-1 transition-all shrink-0"
                          >
                            <X size={11} /> TUTUP
                          </button>
                        ) : (
                          <button
                            onClick={() => openChatWithUser(cu.id)}
                            className="px-2.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] font-black rounded-lg flex items-center gap-1 transition-all shrink-0 active:scale-95"
                          >
                            <MessageSquare size={11} /> BALAS
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ==================== KOLOM KANAN: Jendela Room Percakapan Aktif ==================== */}
              {selectedChatUser ? (
                <div className="lg:col-span-2 border border-gray-200/80 bg-[#0f172a]/80 backdrop-blur-md rounded-2xl p-4 flex flex-col h-120 lg:h-full justify-between animate-in slide-in-from-right duration-300 shadow-2xl relative overflow-hidden">

                  {/* Header Jendela Chat Room */}
                  <div className="pb-3 border-b border-gray-200/80 flex justify-between items-center bg-transparent shrink-0">
                    <div>
                      <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                        LIVE CONNECTION
                      </span>
                      <h3 className="text-xs font-black text-white uppercase mt-1 tracking-wide">
                        ROOM: {chatUsers.find(u => u.id === selectedChatUser)?.full_name || 'Customer'}
                      </h3>
                      <p className="text-[9px] text-slate-500 font-mono tracking-tight">
                        UID: {selectedChatUser}
                      </p>
                    </div>
                    <button
                      onClick={closeChatWithUser}
                      className="p-1.5 hover:bg-slate-800/60 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* AREA ISI CHAT */}
                  <div className="flex-1 my-3 overflow-y-auto pr-1 space-y-3 custom-scrollbar flex flex-col">
                    {chatMessages.length === 0 ? (
                      <div className="text-center my-auto space-y-1 py-8 bg-slate-950/20 rounded-xl border border-slate-900 p-4">
                        <MessageSquare className="text-slate-700 mx-auto mb-2" size={24} />
                        <p className="text-xs text-slate-400 font-bold tracking-wide">Belum Ada Pesan</p>
                        <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                          Silakan ketik balasan langsung di bawah. Pesan akan muncul secara realtime.
                        </p>
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => {
                        const isFromAdmin = msg.sender_role === 'admin';
                        return (
                          <div key={msg.id || idx} className={`flex ${isFromAdmin ? 'justify-end ml-auto' : 'justify-start'} max-w-[85%]`}>
                            <div className={`rounded-2xl p-3 shadow-md ${isFromAdmin
                              ? 'bg-orange-500 text-white rounded-tr-none shadow-orange-950/20'
                              : 'bg-blue border border-gray-200 rounded-tl-none'
                              }`}>
                              <p className={`text-xs leading-relaxed ${isFromAdmin ? 'text-orange-50 font-medium' : 'text-slate-200'}`}>
                                {msg.message}
                              </p>
                              <span className={`block text-[8px] font-mono mt-1 ${isFromAdmin ? 'text-orange-200/60 text-right' : 'text-slate-500 text-left'}`}>
                                {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {isFromAdmin ? 'Admin' : 'Customer'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Form Kirim Chat */}
                  <form onSubmit={handleSendMessage} className="pt-3 border-t border-gray-200/80 flex gap-2 bg-transparent shrink-0">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ketik pesan balasan admin dan tekan enter..."
                      className="flex-1 bg-slate-950/80 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                      required
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/10 shrink-0"
                    >
                      <Send size={12} /> KIRIM
                    </button>
                  </form>

                </div>
              ) : (
                <div className="hidden lg:flex lg:col-span-2 border border-gray-200/60 bg-white/10 rounded-2xl p-8 flex-col items-center justify-center text-center text-slate-500 min-h-87.5">
                  <MessageSquare className="text-slate-700 mb-2 animate-bounce" size={28} />
                  <p className="text-xs font-bold text-slate-400">Belum Ada Chat Terpilih</p>
                  <p className="text-[10px] text-slate-500 max-w-xs mt-0.5">Pilih salah satu antrean customer di sebelah kiri untuk memulai obrolan live chat, boskuh!</p>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ULASAN BINTANG TAB */}
        {currentSubTab === 'reviews' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Monitoring Ulasan & Rating Produk</h2>
            <div className="overflow-x-auto border border-gray-200 rounded-xl bg-slate-950/20">
              <table className="w-full text-left text-xs">
                <thead className="bg-white border-b border-gray-200 text-slate-400 font-bold uppercase">
                  <tr>
                    <th className="p-3.5">Produk</th>
                    <th className="p-3.5">Rating</th>
                    <th className="p-3.5">Komentar</th>
                    <th className="p-3.5">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {allReviews.length === 0 ? (
                    <tr><td colSpan="4" className="p-4 text-center text-slate-500">Belum ada ulasan bintang dari pelanggan.</td></tr>
                  ) : (
                    allReviews.map((r, index) => (
                      <tr key={r.id || index} className="hover:bg-white/20">
                        <td className="p-3.5 font-bold text-white uppercase tracking-tight">{r.products?.name || r.product_name || 'Produk'}</td>
                        <td className="p-3.5">
                          <span className="flex items-center gap-0.5 text-amber-400">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={13} className={s <= Number(r.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'} />
                            ))}
                            <span className="text-[10px] text-slate-500 ml-1 font-mono">({r.rating}/5)</span>
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300 max-w-62.5 truncate">{r.comment || '-'}</td>
                        <td className="p-3.5 text-slate-500 font-mono text-[10px]">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}