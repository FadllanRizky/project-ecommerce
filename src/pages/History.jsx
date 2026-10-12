import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { transactionApi } from '../api/transactionApi';
import { Clock, Truck, Star, MessageSquareCheck, CheckCircle, RefreshCw, PackageCheck } from 'lucide-react';
import Swal from 'sweetalert2';

// Samakan dengan backend normalizeStatus: DB 'completed' tampil sebagai SUCCESS/SELESAI
function normalizeStatus(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (['completed', 'complete', 'success', 'sukses', 'selesai', 'done'].includes(s)) return 'completed';
  if (['shipping', 'shipped', 'kirim', 'dikirim', 'dalam perjalanan', 'delivery'].includes(s)) return 'shipping';
  return 'processing';
}

function getStatusMeta(raw) {
  const st = normalizeStatus(raw);
  if (st === 'completed') {
    return {
      key: 'completed',
      label: 'SUCCESS / SELESAI',
      cls: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
    };
  }
  if (st === 'shipping') {
    return {
      key: 'shipping',
      label: 'DALAM PERJALANAN',
      cls: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
    };
  }
  return {
    key: 'processing',
    label: 'PROSES',
    cls: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
  };
}

function parseMaxDays(estimation) {
  if (estimation === null || estimation === undefined) return 7;
  const m = String(estimation).match(/(\d+)/g);
  if (!m) return 7;
  const nums = m.map(Number).filter(Number.isFinite);
  return nums.length ? Math.max(...nums) : 7;
}

function getEtaInfo(tx) {
  try {
    let arrival = tx.estimated_arrival_date ? new Date(tx.estimated_arrival_date) : null;
    if (!arrival || Number.isNaN(arrival.getTime())) {
      if (!tx.created_at) return null;
      const created = new Date(tx.created_at);
      if (Number.isNaN(created.getTime())) return null;
      arrival = new Date(created.getTime() + parseMaxDays(tx.estimated_delivery) * 24 * 60 * 60 * 1000);
    }
    const now = new Date();
    const diffMs = arrival.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    return { arrival, diffDays };
  } catch {
    return null;
  }
}

export default function History() {
  const { token } = useAuth();
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);

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

  const fetchHistory = useCallback(async (silent = false) => {
    if (!token) return;
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await transactionApi.getHistory(token);
      setHistories(data.success ? data.data : []);
    } catch (err) {
      if (!silent) console.error("Gagal load history transaksi belanja:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Polling ringan tiap 20 detik agar perubahan shipping->completed (via cron/admin) terlihat tanpa reload manual
  useEffect(() => {
    if (!token) return;
    const iv = setInterval(() => fetchHistory(true), 20000);
    return () => clearInterval(iv);
  }, [token, fetchHistory]);

  const handleConfirmReceived = async (txId) => {
    const ok = await Swal.fire({
      ...lightSwal,
      title: 'BARANG SUDAH SAMPAI?',
      text: 'Klik YA jika paket sudah diterima. Status akan berubah menjadi SUCCESS / SELESAI.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'Ya, Sudah Sampai',
      cancelButtonText: 'Belum',
    });
    if (!ok.isConfirmed) return;

    setConfirmingId(txId);
    try {
      const res = await transactionApi.confirmReceived(txId, token);
      if (res?.success) {
        setHistories((prev) => prev.map((t) => (t.id === txId ? { ...t, status: 'completed' } : t)));
        Swal.fire({ ...lightSwal, title: 'MANTAP BOSKUH!', text: 'Pesanan ditandai SELESAI (SUCCESS). Silakan kasih bintang!', icon: 'success', confirmButtonColor: '#f97316', timer: 1800, showConfirmButton: false });
        fetchHistory(true);
      }
    } catch (err) {
      Swal.fire({
        ...lightSwal,
        title: 'GAGAL UPDATE!',
        text: err.response?.data?.error || err.response?.data?.message || 'Gagal menandai pesanan diterima.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setConfirmingId(null);
    }
  };

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
        fetchHistory(true);
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Clock className="text-orange-500" size={24} /> RIWAYAT BELANJA & PESANAN
          </h1>
          <p className="text-xs text-gray-400 mt-1">Pantau status pengiriman logistik serta berikan ulasan bintang pada barang yang dibeli.</p>
        </div>
        <button
          onClick={() => fetchHistory(true)}
          disabled={refreshing || loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:border-orange-300 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Menyegarkan...' : 'Refresh Status'}
        </button>
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
          {histories.map((tx) => {
            const meta = getStatusMeta(tx.status);
            const eta = getEtaInfo(tx);
            const canConfirm = meta.key === 'processing' || meta.key === 'shipping';
            return (
            <div key={tx.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-gray-200 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-gray-500 font-mono text-[11px]">{tx.created_at ? new Date(tx.created_at).toLocaleString('id-ID') : '-'}</span>
                  <span className="px-2 py-0.5 font-bold uppercase rounded bg-gray-100 text-gray-700 tracking-wider">ID: #{String(tx.id || '').substring(0,8)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-gray-500 flex items-center gap-1 font-medium text-[11px]"><Truck size={13} /> {tx.shipping_region || '-'} ({tx.estimated_delivery || '-'})</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${meta.cls}`}>
                    {meta.label}
                  </span>
                </div>
              </div>

              {eta && meta.key !== 'completed' && (
                <div className={`text-[11px] font-medium px-3 py-2 rounded-xl border ${eta.diffDays < 0 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                  Estimasi tiba: <strong>{eta.arrival.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                  {' '}— {eta.diffDays < 0 ? `terlambat ${Math.abs(eta.diffDays)} hari (segera jadi SUCCESS otomatis / klik diterima)` : eta.diffDays === 0 ? 'tiba hari ini' : `sisa ${eta.diffDays} hari`}
                </div>
              )}

              <div className="divide-y divide-gray-200">
                {tx.transaction_items?.map((item) => {
                  const itemProduct = item.products || {};
                  const isReviewed = tx.product_reviews?.some(r => r.product_id === itemProduct.id);

                  return (
                    <div key={item.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <img src={itemProduct.image_url || 'https://via.placeholder.com/150'} alt={itemProduct.name} className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-xl border border-gray-200 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-gray-900 text-sm truncate">{itemProduct.name || 'Produk Terhapus'}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{item.quantity} Barang x Rp {Number(item.price).toLocaleString('id-ID')}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {isReviewed ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-500 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl">
                            <CheckCircle size={13} /> Ulasan Terkirim
                          </span>
                        ) : meta.key === 'completed' ? (
                          <button
                            onClick={() => handleOpenReviewModal(tx.id, itemProduct)}
                            className="bg-white border border-gray-200 hover:border-amber-500/40 text-amber-500 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 hover:bg-amber-50 active:scale-95"
                          >
                            <Star size={13} fill="currentColor" /> Beri Bintang & Komen
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
                            <Clock size={13} /> Tunggu Pesanan Tiba
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm">
                <span className="text-gray-500 text-xs">Metode: <strong className="text-gray-600 font-mono font-bold">{tx.payment_method}</strong></span>
                <div className="flex flex-wrap items-center gap-2">
                  {canConfirm && (
                    <button
                      onClick={() => handleConfirmReceived(tx.id)}
                      disabled={confirmingId === tx.id}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-black text-[11px] uppercase tracking-widest px-4 py-2 rounded-xl transition-all active:scale-95"
                    >
                      <PackageCheck size={13} />
                      {confirmingId === tx.id ? 'Memproses...' : 'Pesanan Sudah Diterima'}
                    </button>
                  )}
                  <span className="font-bold text-gray-900 text-xs sm:text-sm">Total Bayar: <span className="text-orange-600 font-black font-mono">Rp {Number(tx.amount).toLocaleString('id-ID')}</span></span>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 lg:p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-4 lg:p-6 shadow-2xl space-y-4 text-left relative mx-auto">
            <h3 className="text-sm lg:text-base font-black text-gray-900 flex items-center gap-2">
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
