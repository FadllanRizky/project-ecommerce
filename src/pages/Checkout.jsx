import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { transactionApi } from '../api/transactionApi';
import { shippingRegionApi } from '../api/shippingRegionApi';
import { ShoppingBag, Truck, Wallet, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Checkout({ cart, totalAmount, clearCart, setTab }) {
    const { token, user, refreshUser } = useAuth();
    const [region, setRegion] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [regions, setRegions] = useState([]);

    useEffect(() => {
        shippingRegionApi.getAll()
            .then(res => {
                const list = res?.data || res?.data?.data || [];
                setRegions(Array.isArray(list) ? list : []);
            })
            .catch(() => setRegions([]));
    }, []);

    const selectedRegionData = regions.find(r => r.name === region);
    const estimation = selectedRegionData ? selectedRegionData.estimated_delivery : '-';

    const handleProcessCheckout = async () => {
        if (!region) {
            Swal.fire({
                title: 'Wilayah Kosong!',
                text: 'Pilih wilayah pengiriman dulu dong, boskuh!',
                icon: 'warning',
                background: '#FFF',
                color: '#374151',
                confirmButtonColor: '#f97316'
            });
            return;
        }
        setError('');
        setLoading(true);

        try {
            const itemsPayload = cart.map(item => ({
                product_id: item.id,
                quantity: item.quantity
            }));

            const data = await transactionApi.checkout(itemsPayload, region, token);

            if (data && (data.transaction_id || data.message)) {

                Swal.fire({
                    title: 'Transaksi Sukses, Boskuh!',
                    html: `Barang berhasil dibeli menggunakan saldo internal.<br><b class="text-blue-600">Estimasi sampai: ${data.estimation || '1-2 Hari'}</b>`,
                    icon: 'success',
                    background: '#FFF',
                    color: '#374151',
                    confirmButtonColor: '#f97316',
                    confirmButtonText: 'Mantap Bos!'
                });

                clearCart();

                if (refreshUser) {
                    const sisaSaldoLu = user.balance - totalAmount;
                    await refreshUser(sisaSaldoLu);
                }

                setTab('history');
            }
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.error || 'Gagal memproses checkout barang, bos!';
            setError(errorMsg);

            Swal.fire({
                title: 'Gagal Transaksi!',
                text: errorMsg,
                icon: 'error',
                background: '#FFF',
                color: '#374151',
                confirmButtonColor: '#EF4444'
            });
        } finally {
            loading && setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 text-gray-600 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <ShoppingBag className="text-orange-500" size={24} /> FORM TRANSAKSI & PEMESANAN
                </h1>
                <p className="text-xs text-gray-400 mt-1">Konfirmasi barang belanjaan dan cek simulasi pengiriman regional Indonesia.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xl">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Item yang Dibeli</h2>
                        <div className="divide-y divide-gray-200">
                            {cart.map((item) => (
                                <div key={item.id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <img src={item.image_url || 'https://via.placeholder.com/150'} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                                            <p className="text-xs text-gray-500">{item.quantity} pcs x Rp {Number(item.price).toLocaleString('id-ID')}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-gray-600 text-sm">Rp {Number(item.price * item.quantity).toLocaleString('id-ID')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xl space-y-4">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Detail Pengiriman</h2>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Pilih Wilayah Tujuan</label>
                            <select
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-orange-500 font-medium"
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                            >
                                <option value="">-- Pilih Regional Wilayah --</option>
                                {regions.map(r => (
                                    <option key={r.id} value={r.name}>{r.name} ({r.estimated_delivery})</option>
                                ))}
                            </select>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
                            <Truck className="text-blue-600 shrink-0 mt-0.5" size={18} />
                            <div>
                                <h5 className="text-xs font-bold text-gray-700">Simulasi Estimasi Tiba:</h5>
                                <p className="text-sm font-black text-blue-600 mt-0.5">{estimation}</p>
                            </div>
                        </div>

                        <hr className="border-gray-200" />

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Total Belanja</span>
                                <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Ongkos Kirim</span>
                                <span className="text-orange-500 font-bold">Rp 0 (FREE)</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
                                <span className="text-sm font-bold text-gray-900">Total Bayar</span>
                                <span className="text-lg font-black text-orange-500 font-mono">Rp {totalAmount.toLocaleString('id-ID')}</span>
                            </div>
                        </div>

                        {error && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl text-center font-bold">{error}</p>}

                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex justify-between items-center text-xs">
                            <span className="text-gray-500 flex items-center gap-1.5"><Wallet size={14} /> Metode: internal Balance</span>
                            <span className="text-orange-600 font-black font-mono">Sisa: Rp {Number(user?.balance || 0).toLocaleString('id-ID')}</span>
                        </div>

                        <button
                            onClick={handleProcessCheckout}
                            disabled={loading || cart.length === 0}
                            className="w-full bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:bg-gray-100 disabled:text-gray-500 text-white font-black uppercase text-xs tracking-widest py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-200 active:scale-95"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>Konfirmasi Bayar Sekarang <ArrowRight size={14} /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
