import React from 'react';
import { Eye, ShoppingBag, Heart, MessageSquare } from 'lucide-react';

export default function ProductCard({ product, onDetail, onAddToCart, isFavorite, onToggleFavorite }) {
  const displayImage = product.image_url || product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80';
  const displayName = product.name || product.nama || product.description || 'Premium Product';
  const displayBrand = product.brand || product.merk || 'GENERIC';
  const displayPrice = product.price || product.harga || 0;
  const displayStock = product.stok !== undefined ? product.stok : (product.stock !== undefined ? product.stock : 0);

  const triggerChatWidget = (e) => {
    e.stopPropagation();
    const chatBtn = document.querySelector('#mbur-chat-wrapper button') || document.querySelector('.live-chat-widget button');
    if (chatBtn) {
      chatBtn.click();
    } else {
      alert("Widget chat admin belum siap atau belum termuat bos!");
    }
  };

  return (
    <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-orange-500/40 transition-all duration-300 hover:-translate-y-1 shadow-xl hover:shadow-orange-100 relative">
      
      <button 
        onClick={(e) => { 
          e.stopPropagation(); 
          onToggleFavorite(product.id); 
        }} 
        className="absolute top-3 left-3 z-10 p-2 rounded-xl bg-white border border-gray-200 backdrop-blur-sm transition-all text-gray-500 hover:text-rose-500"
      >
        <Heart size={15} fill={isFavorite ? '#F43F5E' : 'transparent'} className={isFavorite ? 'text-rose-500' : 'text-gray-500'} />
      </button>

      <div className="relative overflow-hidden aspect-square bg-gray-50">
        <img 
          src={displayImage} 
          alt={displayName} 
          className="w-full h-full object-contain p-4 opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" 
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'; }}
        />
        <span className="absolute top-3 right-3 text-[10px] uppercase tracking-widest font-extrabold px-2.5 py-1 bg-white text-orange-500 rounded-md border border-gray-200 shadow-md">
          {displayBrand}
        </span>
      </div>

      <div className="p-5 bg-white">
        <h3 className="text-base font-bold text-gray-800 line-clamp-1 group-hover:text-gray-900 transition-colors">
          {displayName}
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Stok: <span className="text-gray-700 font-medium">{displayStock} pcs</span>
        </p>
        
        <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
          <span className="text-base font-black text-orange-600">
            Rp {Number(displayPrice).toLocaleString('id-ID')}
          </span>
          <div className="flex gap-2">
            <button onClick={triggerChatWidget} className="p-2 bg-gray-100 hover:bg-gray-200 text-blue-600 rounded-lg transition-colors" title="Hubungi Admin">
              <MessageSquare size={16} />
            </button>
            <button onClick={() => onDetail(product)} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors" title="Detail Produk">
              <Eye size={16} />
            </button>
            <button onClick={() => onAddToCart(product, 1)} className="p-2 bg-orange-50 hover:bg-orange-500 text-orange-500 hover:text-white border border-orange-200 hover:border-transparent rounded-lg transition-all" title="Tambah ke Keranjang">
              <ShoppingBag size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
