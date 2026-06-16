import React from 'react';
import { X, Trash2, Plus, Minus, CreditCard } from 'lucide-react';

export default function CartModal({ isOpen, onClose, cart, setCart, onCheckout }) {
  if (!isOpen) return null;

  const updateQuantity = (id, amount) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = (item.quantity || 1) + amount;
            return newQty > 0 ? { ...item, quantity: newQty } : item;
          }
          return item;
        })
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const totalPrice = cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-white border-l border-gray-200 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
        
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-wider">Keranjang Bos</h2>
            <span className="bg-orange-50 text-orange-500 text-xs px-2.5 py-0.5 rounded-full font-bold border border-orange-200">
              {cart.length} Item
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900 transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
              <p className="text-sm">Keranjang bos masih kosong melompong.</p>
            </div>
          ) : (
            cart.map((item) => {
              const qty = item.quantity || 1;
              return (
                <div key={item.id} className="flex gap-4 p-3 bg-white border border-gray-200 rounded-xl relative group">
                  <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center p-1 flex-shrink-0">
                    <img 
                      src={item.image_url || item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'} 
                      alt={item.name} 
                      className="max-w-full max-h-full object-contain" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-800 truncate pr-6">{item.description || item.name}</h4>
                    <p className="text-xs text-orange-500 font-bold mt-0.5">Rp {Number(item.price * qty).toLocaleString('id-ID')}</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 bg-white hover:bg-gray-100 rounded-md border border-gray-200 text-gray-500 hover:text-gray-900 transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-mono font-bold text-gray-700 px-1 w-6 text-center">{qty}</span>
                      <button 
                        onClick={() => {
                          const maxStock = item.stok !== undefined ? item.stok : (item.stock || 0);
                          if(qty >= maxStock) return;
                          updateQuantity(item.id, 1);
                        }} 
                        className="p-1 bg-white hover:bg-gray-100 rounded-md border border-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="absolute top-3 right-3 text-gray-500 hover:text-rose-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-4 border-t border-gray-200 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Pembayaran</span>
            <span className="text-lg font-black text-orange-500 font-mono">Rp {totalPrice.toLocaleString('id-ID')}</span>
          </div>
          <button 
            disabled={cart.length === 0}
            onClick={() => { onCheckout(totalPrice); onClose(); }}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:bg-gray-100 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
          >
            <CreditCard size={16} /> BAYAR SEKARANG VIA SALDO
          </button>
        </div>

      </div>
    </div>
  );
}
