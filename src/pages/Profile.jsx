import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Fingerprint, Wallet, Shield, TrendingUp, RefreshCw, BadgeCheck, Camera, Link as LinkIcon, X } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../api/axiosInstance';
import { uploadApi } from '../api/uploadApi';

export default function Profile() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const fileInputRef = useRef(null);

  const fetchProfile = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.get('/auth/me');
      const fresh = res.data?.user || res.data?.data || res.data;
      if (fresh) {
        setProfile(fresh);
        localStorage.setItem('user', JSON.stringify(fresh));
      }
    } catch (err) {
      console.error('Gagal refresh profil:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Swal.fire({ title: 'Format Salah', text: 'Harus berupa file gambar!', icon: 'warning', background: '#FFF', color: '#374151' });
      return;
    }

    setUploading(true);
    try {
      const res = await uploadApi.uploadAvatar(file);
      if (res?.avatar_url) {
        const updatedUser = { ...profile, avatar_url: res.avatar_url };
        setProfile(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        Swal.fire({ title: 'Berhasil!', text: 'Foto profil berhasil diupload!', icon: 'success', background: '#FFF', color: '#374151', timer: 1500, showConfirmButton: false });
      }
    } catch (err) {
      Swal.fire({ title: 'Gagal!', text: err.response?.data?.error || 'Gagal upload avatar', icon: 'error', background: '#FFF', color: '#374151' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlValue.trim()) return;
    setUploading(true);
    try {
      const res = await uploadApi.updateAvatarUrl(urlValue.trim());
      if (res?.avatar_url) {
        const updatedUser = { ...profile, avatar_url: res.avatar_url };
        setProfile(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        Swal.fire({ title: 'Berhasil!', text: 'URL avatar diperbarui!', icon: 'success', background: '#FFF', color: '#374151', timer: 1500, showConfirmButton: false });
        setShowUrlInput(false);
        setUrlValue('');
      }
    } catch (err) {
      Swal.fire({ title: 'Gagal!', text: err.response?.data?.error || 'Gagal update URL avatar', icon: 'error', background: '#FFF', color: '#374151' });
    } finally {
      setUploading(false);
    }
  };

  const p = profile || user || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-gray-600 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <User className="text-orange-500" size={24} /> DATA DIRI & PROFIL
        </h1>
        <p className="text-xs text-gray-400 mt-1">Informasi personal akun dan parameter keuangan Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              {p.avatar_url ? (
                <img
                  src={p.avatar_url}
                  alt="avatar"
                  className="w-16 h-16 rounded-2xl object-cover border border-gray-200"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div className={`w-16 h-16 bg-linear-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-200 ${p.avatar_url ? 'hidden' : ''}`}>
                {(p.full_name || 'U').substring(0, 2).toUpperCase()}
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Camera size={18} className="text-white" />
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-gray-900">{p.full_name || 'User'}</h2>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-500 hover:text-gray-900 transition-all"
                  title="Upload foto"
                >
                  <Camera size={14} />
                </button>
                <button
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-500 hover:text-gray-900 transition-all"
                  title="Pakai URL gambar"
                >
                  <LinkIcon size={14} />
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <BadgeCheck size={14} className="text-orange-500" />
                {p.role === 'admin' ? 'Administrator' : 'Customer Terdaftar'}
              </div>
            </div>
          </div>

          {showUrlInput && (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2">
              <input
                type="text"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="flex-1 bg-transparent text-xs text-gray-900 px-2 py-1.5 outline-none placeholder:text-gray-400"
              />
              <button onClick={handleUrlSubmit} disabled={uploading} className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg transition-all">
                {uploading ? '...' : 'Simpan'}
              </button>
              <button onClick={() => { setShowUrlInput(false); setUrlValue(''); }} className="p-1.5 text-gray-500 hover:text-gray-900 transition-all">
                <X size={14} />
              </button>
            </div>
          )}

          <div className="divide-y divide-gray-200 text-sm">
            <div className="py-3 flex items-center gap-3">
              <Mail size={16} className="text-gray-400 shrink-0" />
              <span className="text-gray-500 w-24 shrink-0">Email</span>
              <span className="text-gray-900 font-mono">{p.email || '-'}</span>
            </div>
            <div className="py-3 flex items-center gap-3">
              <Fingerprint size={16} className="text-gray-400 shrink-0" />
              <span className="text-gray-500 w-24 shrink-0">User ID</span>
              <span className="text-gray-500 font-mono text-xs truncate">{p.id || '-'}</span>
            </div>
            <div className="py-3 flex items-center gap-3">
              <Shield size={16} className="text-gray-400 shrink-0" />
              <span className="text-gray-500 w-24 shrink-0">Role</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${p.role === 'admin' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-500'}`}>
                {p.role || 'customer'}
              </span>
            </div>
          </div>

          <button
            onClick={fetchProfile}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-all active:scale-95"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Memuat...' : 'Refresh Data'}
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-linear-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-gray-400 uppercase mb-3">
              <Wallet size={14} /> Saldo Dompet
            </div>
            <h2 className="text-2xl font-black text-orange-500 tracking-tight">
              Rp {Number(p.balance || 0).toLocaleString('id-ID')}
            </h2>
          </div>

          <div className="bg-gray-50/50 border border-gray-200 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-blue-600" /> Limit Pinjaman
              </span>
              <span className="text-sm font-black text-blue-600">
                Rp {Number(p.loan_limit || 0).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 flex items-center gap-1.5">
                <Shield size={14} className="text-amber-500" /> Credit Score
              </span>
              <span className="text-sm font-black text-amber-500">
                {p.credit_score || 0} pts
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
