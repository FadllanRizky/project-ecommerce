import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, CalendarRange, Plus, Minus, Truck } from 'lucide-react';
import { shippingRegionApi } from '../api/shippingRegionApi';

export default function ProductDetailModal({ product, isOpen, onClose, onAddToCart, onAddToLoan }) {
  const [quantity, setQuantity] = useState(1);
  const [region, setRegion] = useState('');
  const [regions, setRegions] = useState([]);
  const [estimation, setEstimation] = useState('-');

  useEffect(() => {
    if (isOpen) setQuantity(1);
  }, [isOpen, product]);

  useEffect(() => {
    shippingRegionApi.getAll()
      .then(res => {
        const list = res?.data || res?.data?.data || [];
        setRegions(Array.isArray(list) ? list : []);
      })
      .catch(() => setRegions([]));
  }, []);

  useEffect(() => {
    const selected = regions.find(r => r.name === region);
    setEstimation(selected ? selected.estimated_delivery : '-');
  }, [region, regions]);

  if (!isOpen || !product) return null;

  const displayImage = product.image_url || product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80';
  const displayName = product.name || product.nama || product.description || 'Premium Product';
  const displayBrand = product.brand || product.merk || 'GENERIC';
  const displayPrice = product.price || product.harga || 0;
  const maxStock = product.stok !== undefined ? product.stok : (product.stock || 0);
  const displayDesc = product.description || `Produk original berkualitas tinggi dari brand ${displayBrand}. Memiliki spesifikasi kelas atas yang siap mendukung produktivitas kerja maupun kebutuhan harian bos.`;

  const handleQtyChange = (val) => {
    if (val <= 0) return;
    if (val > maxStock) return;
    setQuantity(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 transition-all">
      <div className="bg-white border border-gray-200 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        <div className="relative h-80 bg-gray-50 flex items-center justify-center p-4">
          <img src={displayImage} alt={displayName} className="max-w-full max-h-full object-contain opacity-95" />
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors z-10">
            <X size={18} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-white via-white/40 to-transparent">
            <span className="text-xs uppercase tracking-widest font-extrabold px-2.5 py-1 bg-orange-50 text-orange-500 rounded-md border border-orange-200">
              {displayBrand}
            </span>
            <h2 className="text-2xl font-black text-gray-900 mt-2 drop-shadow-md">{displayName}</h2>
          </div>
        </div>

        <div className="p-6 space-y-4 bg-white">
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
              <p className="text-xs text-gray-500">Harga Satuan</p>
              <p className="text-lg font-bold text-orange-500">Rp {Number(displayPrice).toLocaleString('id-ID')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Ketersediaan Stok</p>
              <p className="text-lg font-bold text-gray-800">{maxStock} Unit tersedia</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded-xl">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Atur Kuantitas Beli</span>
            <div className="flex items-center gap-3">
              <button onClick={() => handleQtyChange(quantity - 1)} className="p-1.5 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-gray-500">
                <Minus size={14} />
              </button>
              <input 
                type="number" 
                value={quantity} 
                onChange={(e) => handleQtyChange(parseInt(e.target.value) || 1)}
                className="w-14 bg-white text-center font-mono font-bold text-gray-900 text-sm focus:outline-none border border-gray-200 py-1 rounded-md"
              />
              <button onClick={() => handleQtyChange(quantity + 1)} className="p-1.5 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-gray-500">
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Spesifikasi / Detail</h4>
            <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
              {displayDesc}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
              <Truck size={14} /> Estimasi Pengiriman
            </h4>
            <select
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-orange-500"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="">-- Pilih Wilayah Tujuan --</option>
              {regions.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 text-xs">Estimasi sampai:</span>
              <span className="font-black text-orange-600">{estimation}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 flex gap-3">
            <button 
              onClick={() => { onAddToCart(product, quantity); onClose(); }}
              className="flex-1 py-3 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-200"
            >
              <ShoppingCart size={16} /> Masukkan Keranjang ({quantity}x)
            </button>
            <button 
              onClick={() => { onAddToLoan(product); onClose(); }}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <CalendarRange size={16} /> Ajukan Pinjaman
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
