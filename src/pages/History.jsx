import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { transactionApi } from '../api/transactionApi';
import { Clock, Truck, Star, MessageSquareCheck, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export default function History() {
  const { token } = useAuth();
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [txIdForReview, setTxIdForReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const lightSwal = {
    background: '#FFF',
    color: '#374151',
    customClass: {
      popup: 'border border-gray-200 rounded-2xl shadow-2xl',
      title: 'text-gray-900 font-black text-lg',
      htmlContainer: 'text-gray-500 text-sm'
    }
  };

  const fetchHistory = async () => {
    if (!token) return;
    loading || setLoading(true);
    try {
      const data = await transactionApi.getHistory(token);
      setHistories(data.success ? data.data : []);
    } catch (err) {
      console.error("Gagal load history transaksi belanja:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const handleOpenReviewModal = (txId, product) => {
    setTxIdForReview(txId);
    setSelectedProduct(product);
    setRating(5);
    setComment('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      return Swal.fire({
        ...lightSwal,
        title: 'WADUH BOSKUH!',
        text: 'Isi ulasan teksnya dulu, jangan dikosongin ya!',
        icon: 'warning',
        confirmButtonColor: '#f59e0b',
      });
    }
    
    setSubmittingReview(true);

    try {
      const data = await transactionApi.createReview({
        transaction_id: txIdForReview,
        product_id: selectedProduct.id,
        rating,
        comment
      }, token);

      if (data.success) {
        Swal.fire({
          ...lightSwal,
          title: 'MANTAP BOSKUH!',
          text: 'Ulasan bintang berhasil dikirim! Terima kasih banyak.',
          icon: 'success',
          confirmButtonColor: '#f97316',
        });
        
        setSelectedProduct(null);
        fetchHistory(); 
      }
    } catch (err) {
      Swal.fire({
        ...lightSwal,
        title: 'PROSES GAGAL!',
        text: err.response?.data?.error || 'Gagal mengirim review ke server.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-gray-600 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <Clock className="text-orange-500" size={24} /> RIWAYAT BELANJA & PESANAN
        </h1>
        <p className="text-xs text-gray-400 mt-1">Pantau status pengiriman logistik serta berikan ulasan bintang pada barang yang dibeli.</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500 text-sm flex flex-col items-center gap-2 bg-white border border-gray-200 rounded-2xl">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span>Memuat data paket belanjaan boskuh...</span>
        </div>
      ) : histories.length === 0 ? (
        <div className="p-12 text-center text-gray-400 text-sm bg-white border border-gray-200 rounded-2xl">
          Belum ada riwayat pemesanan produk di akun bos. Yuk belanja di etalase!
        </div>
      ) : (
        <div className="space-y-4">
          {histories.map((tx) => (
            <div key={tx.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-gray-200 text-xs">
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 font-mono">{new Date(tx.created_at).toLocaleString('id-ID')}</span>
                  <span className="px-2 py-0.5 font-bold uppercase rounded bg-gray-100 text-gray-700 tracking-wider">ID: #{tx.id.substring(0,8)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 flex items-center gap-1 font-medium"><Truck size={13} /> Wilayah: {tx.shipping_region} ({tx.estimated_delivery})</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">{tx.status}</span>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {tx.transaction_items?.map((item) => {
                  const itemProduct = item.products || {};
                  const isReviewed = tx.product_reviews?.some(r => r.product_id === itemProduct.id);

                  return (
                    <div key={item.id} className="py-4 flex flex-wrap justify-between items-center gap-4 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <img src={itemProduct.image_url || 'https://via.placeholder.com/150'} alt={itemProduct.name} className="w-14 h-14 object-cover rounded-xl border border-gray-200" />
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm">{itemProduct.name || 'Produk Terhapus'}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{item.quantity} Barang x Rp {Number(item.price).toLocaleString('id-ID')}</p>
                        </div>
                      </div>

                      <div>
                        {isReviewed ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-500 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl">
                            <CheckCircle size={13} /> Ulasan Terkirim
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenReviewModal(tx.id, itemProduct)}
                            className="bg-white border border-gray-200 hover:border-amber-500/40 text-amber-500 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 hover:bg-amber-50 active:scale-95"
                          >
                            <Star size={13} fill="currentColor" /> Beri Bintang & Komen
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-sm">
                <span className="text-gray-500 text-xs">Metode Pembayaran: <strong className="text-gray-600 font-mono font-bold">{tx.payment_method}</strong></span>
                <span className="font-bold text-gray-900">Total Bayar: <span className="text-orange-600 font-black font-mono">Rp {Number(tx.amount).toLocaleString('id-ID')}</span></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-left relative">
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
              <MessageSquareCheck className="text-amber-500" size={18} /> ULAS PRODUK BELANJAAN
            </h3>
            <p className="text-xs text-gray-500">Berikan penilaian objektif lu untuk produk <strong className="text-gray-900">{selectedProduct.name}</strong>, boskuh.</p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Jumlah Bintang Kece</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-transform active:scale-90"
                    >
                      <Star 
                        size={26} 
                        className={star <= rating ? 'text-amber-500' : 'text-gray-300'} 
                        fill={star <= rating ? 'currentColor' : 'none'} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Isi Komentar / Kesan</label>
                <textarea
                  className="w-full h-24 bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-amber-500 placeholder:text-gray-400 font-medium"
                  placeholder="Barangnya mantap pol bos, pengiriman jawa barat cuman sehari sampai..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={250}
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-linear-to-r from-amber-500 to-orange-600 text-white font-black text-xs uppercase tracking-widest px-5 py-2.5 rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                  {submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
