import React, { useState } from 'react';
import { ShoppingCart, LogIn, LogOut, PackageCheck, History, Wallet, Heart, ShieldCheck, LayoutDashboard, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar({ cartCount, onCartClick, currentTab, setTab, favoriteCount }) {
  const { user, token, logout, setIsAuthModalOpen, setAuthMode } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Cek apakah user login sebagai admin
  const isAdmin = token && user?.role === 'admin';

  const handleTabChange = (tab) => {
    setTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm px-4 lg:px-6 py-3 lg:py-4 transition-all duration-300">
      <div className="flex justify-between items-center">
      
      <div 
        className="flex items-center gap-2 cursor-pointer group shrink-0" 
        onClick={() => setTab(isAdmin ? 'admin' : 'products')}
      >
        <div className="w-7 h-7 lg:w-8 lg:h-8 bg-linear-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:rotate-12 transition-transform">
          <span className="text-white font-black text-[10px] lg:text-xs">M</span>
        </div>
        <span className="text-base lg:text-xl font-black tracking-tighter">
          <span className="text-gray-800">MBUR</span> <span className="text-orange-500">STORE</span>
        </span>
      </div>

      {/* 🔥 Mobile hamburger */}
      <button 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden p-2 text-gray-500 hover:text-gray-900"
      >
        <div className="space-y-1">
          <span className={`block w-6 h-0.5 bg-gray-600 transition-transform ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-gray-600 transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-gray-600 transition-transform ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
        </div>
      </button>

      <div className="hidden md:flex items-center gap-2 text-[11px] font-black uppercase tracking-widest">
        
        {isAdmin ? (
          <button 
            onClick={() => setTab('admin')} 
            className={`px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all ${currentTab === 'admin' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-blue-600 hover:bg-blue-50'}`}
          >
            <LayoutDashboard size={14} /> Kontrol Dashboard
          </button>
        ) : (
          <>
            <button 
              onClick={() => setTab('products')} 
              className={`px-5 py-2.5 rounded-xl transition-all ${currentTab === 'products' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Etalase
            </button>

            {token && (
              <>
                <button 
                  onClick={() => setTab('loans')} 
                  className={`px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all ${currentTab === 'loans' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  <PackageCheck size={14} /> Pinjaman
                </button>
                
                <button 
                  onClick={() => setTab('history')} 
                  className={`px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all ${currentTab === 'history' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  <History size={14} /> Riwayat
                </button>

                <button 
                  onClick={() => setTab('profile')} 
                  className={`px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all ${currentTab === 'profile' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  <User size={14} /> Profil Saya
                </button>
              </>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        
        {!token ? (
          <button 
            onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
            className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-black bg-linear-to-r from-orange-500 to-orange-600 hover:scale-105 text-white px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-xl shadow-orange-500/20"
          >
            <LogIn size={15} /> Masuk
          </button>
        ) : (
          <div className="flex items-center gap-3">
            
            {!isAdmin ? (
              <>
                <div className="hidden sm:flex items-center gap-2 bg-white border border-gray-200 shadow-sm px-3 py-2 rounded-xl">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-5 h-5 rounded-lg object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div className="w-5 h-5 bg-linear-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-[8px]">
                      {(user?.full_name || 'U').substring(0, 1).toUpperCase()}
                    </div>
                  )}
                  <Wallet size={14} className="text-orange-500" />
                  <span className="text-xs font-black text-orange-600 font-mono">
                    Rp {Number(user?.balance || 0).toLocaleString('id-ID')}
                  </span>
                </div>

                {favoriteCount > 0 && (
                  <button className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-500 flex items-center gap-1.5 hover:bg-red-500 hover:text-white transition-all">
                    <Heart size={15} fill="currentColor" />
                    <span className="text-xs font-black">{favoriteCount}</span>
                  </button>
                )}

                <button 
                  onClick={onCartClick} 
                  className="relative p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:border-orange-500 hover:text-orange-600 transition-all group"
                >
                  <ShoppingCart size={16} className="group-hover:rotate-12" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white animate-bounce">
                      {cartCount}
                    </span>
                  )}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-5 h-5 rounded-lg object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                  <ShieldCheck size={14} className="text-blue-500" />
                )}
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">System Administrator</span>
              </div>
            )}

            <div className="h-6 w-px bg-gray-200 mx-1"></div>

            <button 
              onClick={logout} 
              className="p-2.5 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl text-gray-400 hover:text-red-500 transition-all group"
              title="Keluar"
            >
              <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}
      </div>
      </div>

      {/* 🔥 MOBILE DROPDOWN MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 border-t border-gray-200 pt-3 flex flex-col gap-2 animate-in slide-in-from-top duration-200">
          {isAdmin ? (
            <button onClick={() => handleTabChange('admin')} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest ${currentTab === 'admin' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              <LayoutDashboard size={14} className="inline mr-2" /> Kontrol Dashboard
            </button>
          ) : (
            <>
              <button onClick={() => handleTabChange('products')} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest ${currentTab === 'products' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'text-gray-600 hover:bg-gray-50'}`}>
                Etalase
              </button>
              {token && (
                <>
                  <button onClick={() => handleTabChange('loans')} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest ${currentTab === 'loans' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <PackageCheck size={14} className="inline mr-2" /> Pinjaman
                  </button>
                  <button onClick={() => handleTabChange('history')} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest ${currentTab === 'history' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <History size={14} className="inline mr-2" /> Riwayat
                  </button>
                  <button onClick={() => handleTabChange('profile')} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest ${currentTab === 'profile' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <User size={14} className="inline mr-2" /> Profil Saya
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </nav>
  );
}