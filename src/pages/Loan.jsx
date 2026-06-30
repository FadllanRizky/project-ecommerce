import React, { useState, useEffect } from 'react';
import { getMyLoans, createLoan, getUserProfile, payLoanInstallment } from '../api/loanApi';
import { getProducts } from '../api/productApi';
import { useAuth } from '../contexts/AuthContext';
import { 
  Banknote, 
  Package, 
  CalendarRange, 
  ShieldCheck, 
  Coins, 
  FileText, 
  ArrowUpRight, 
  HelpCircle,
  User,
  CreditCard,
  Upload,
  Clock,
  AlertCircle,
  Calendar
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function Loan({ autoSelectProduct, clearAutoSelect }) {
  const { token, refreshUser } = useAuth();

  const [loans, setLoans] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [userBalance, setUserBalance] = useState(0); 

  const [cashAmount, setCashAmount] = useState(1000000);
  const [tenureMonth, setTenureMonth] = useState(6);

  const [fullNameApplicant, setFullNameApplicant] = useState('');
  const [nik, setNik] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('DANA');
  const [idCardFile, setIdCardFile] = useState(null);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
  };

  const formatIndonesianDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const calculateNextDueDate = (loanItem) => {
    if (loanItem.next_due_date) {
      return new Date(loanItem.next_due_date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    if (!loanItem.created_at) return '-';
    const date = new Date(loanItem.created_at);
    date.setMonth(date.getMonth() + 1);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const loadLoansAndProfile = async () => {
    try {
      const resLoans = await getMyLoans(token);
      let extractedLoans = [];
      if (Array.isArray(resLoans.data)) extractedLoans = resLoans.data;
      else if (resLoans.data && Array.isArray(resLoans.data.data)) extractedLoans = resLoans.data.data;
      else if (resLoans.data && Array.isArray(resLoans.data.rows)) extractedLoans = resLoans.data.rows;
      setLoans(extractedLoans);

      const resProfile = await getUserProfile(token);

      const balance = resProfile.data?.user?.balance ?? resProfile.data?.data?.balance ?? 0;
      setUserBalance(Number(balance));
    } catch (err) {
      console.error("Gagal sinkronisasi data dengan server:", err);
    }
  };

  useEffect(() => {
    if (!token) return;

    loadLoansAndProfile();

    getProducts().then(res => {
      let extractedProducts = [];
      if (Array.isArray(res.data)) extractedProducts = res.data;
      else if (res.data && Array.isArray(res.data.rows)) extractedProducts = res.data.rows;
      setProducts(extractedProducts);
    });

    const interval = setInterval(loadLoansAndProfile, 5000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (autoSelectProduct && products.length > 0) {
      const targetProduct = products.find(
        p => (p.id || p._id) === (autoSelectProduct.id || autoSelectProduct._id)
      );
      setSelectedProduct(targetProduct ? targetProduct : autoSelectProduct);
      if (clearAutoSelect) clearAutoSelect();
    }
  }, [autoSelectProduct, products, clearAutoSelect]);

  const validateForm = () => {
    if (!fullNameApplicant.trim() || !nik.trim() || !phoneNumber.trim()) {
      Swal.fire({
        title: 'Verifikasi Gagal!',
        text: 'Mohon isi Nama Lengkap, NIK KTP, dan No Whatsapp terlebih dahulu boskuh!',
        icon: 'error',
        background: '#FFF', color: '#374151', confirmButtonColor: '#EF4444',
        customClass: { popup: 'border border-gray-200 rounded-2xl' }
      });
      return false;
    }
    if (nik.trim().length !== 16) {
      Swal.fire({
        title: 'Format NIK Salah!',
        text: 'Nomor NIK KTP harus tepat berisikan 16 digit angka, boskuh!',
        icon: 'warning',
        background: '#FFF', color: '#374151', confirmButtonColor: '#F59E0B',
        customClass: { popup: 'border border-gray-200 rounded-2xl' }
      });
      return false;
    }
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 12) {
      Swal.fire({
        title: 'Nomor HP Tidak Valid!',
        text: 'Nomor Whatsapp harus tepat 12 digit angka (contoh: 081234567890), boskuh!',
        icon: 'warning',
        background: '#FFF', color: '#374151', confirmButtonColor: '#F59E0B',
        customClass: { popup: 'border border-gray-200 rounded-2xl' }
      });
      return false;
    }
    if (!idCardFile) {
      Swal.fire({
        title: 'Berkas KTP Kosong!',
        text: 'Wajib lampirkan foto fisik KTP untuk keamanan validasi anti-fraud sistem admin!',
        icon: 'warning',
        background: '#FFF', color: '#374151', confirmButtonColor: '#F59E0B',
        customClass: { popup: 'border border-gray-200 rounded-2xl' }
      });
      return false;
    }
    return true;
  };

  const handleCash = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (document.activeElement) document.activeElement.blur();
    
    const parsedAmount = Number(cashAmount) || 0;
    const parsedTenure = Number(tenureMonth) || 6;

    Swal.fire({
      title: 'Ajukan Pinjaman Cash?',
      html: `<div class="text-left text-sm space-y-1 text-gray-700">
              <p>Nominal Dana: <b class="text-orange-500">${formatRupiah(parsedAmount)}</b></p>
              <p>Metode Pencairan: <b>VA ${paymentMethod}</b></p>
             </div>`,
      icon: 'question',
      showCancelButton: true,
      background: '#FFF', color: '#374151', confirmButtonColor: '#f97316', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Kirim ke Admin!', cancelButtonText: 'Batal',
      customClass: { popup: 'border border-gray-200 rounded-2xl' }
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Memproses Berkas...',
          text: 'Mengupload identitas & mengirim enkripsi data ke server...',
          allowOutsideClick: false,
          background: '#FFF', color: '#374151', didOpen: () => { Swal.showLoading(); }
        });

        try {
          const monthlyPayment = Math.round((parsedAmount / parsedTenure) + (parsedAmount * 0.05));
          
          const formData = new FormData();
          formData.append('type', 'cash');
          formData.append('loan_amount', parsedAmount.toString());
          formData.append('tenure_month', parsedTenure.toString());
          formData.append('interest_rate', '5');
          formData.append('monthly_payment', monthlyPayment.toString());
          formData.append('reason', 'Pengajuan ekspansi modal usaha mandiri');
          formData.append('full_name_applicant', fullNameApplicant.trim());
          formData.append('nik', nik.trim());
          formData.append('phone_number', phoneNumber.trim());
          formData.append('payment_method', paymentMethod);
          formData.append('id_card', idCardFile);

          await createLoan(formData, token);

          Swal.fire({
            title: 'Pengajuan Terkirim! ⚡',
            text: 'Berkas sukses masuk antrean. Notifikasi otomatis telah dikirim ke Gmail Admin!',
            icon: 'success',
            background: '#FFF', color: '#374151', confirmButtonColor: '#f97316',
            customClass: { popup: 'border border-gray-200 rounded-2xl' }
          });
          
          resetForm();
          loadLoansAndProfile();
        } catch (error) {
          Swal.fire({
            title: 'Gagal Menghubungkan!',
            text: error.response?.data?.message || error.response?.data?.error || 'Terjadi gangguan alokasi atau validasi database pinjaman.',
            icon: 'error',
            background: '#FFF', color: '#374151', confirmButtonColor: '#EF4444'
          });
        }
      }
    });
  };

  const handleProduct = async () => {
    if (!selectedProduct) {
      Swal.fire({
        title: 'Aset Belum Dipilih!',
        text: 'Silakan tentukan unit gadget mewah pilihanmu terlebih dahulu, boskuh!',
        icon: 'warning',
        background: '#FFF', color: '#374151', confirmButtonColor: '#F59E0B'
      });
      return;
    }
    if (!validateForm()) return;
    if (document.activeElement) document.activeElement.blur();

    const displayName = selectedProduct.description || selectedProduct.name || 'Premium Product';
    const productPrice = Number(selectedProduct.price) || 0;

    Swal.fire({
      title: 'Ajukan Pembiayaan Barang?',
      html: `<div class="text-left text-sm space-y-1 text-gray-700">
              <p>Unit Aset: <b class="text-blue-600">${displayName}</b></p>
              <p>Harga Evaluasi: <b>${formatRupiah(productPrice)}</b></p>
             </div>`,
      icon: 'question',
      showCancelButton: true,
      background: '#FFF', color: '#374151', confirmButtonColor: '#3b82f6', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Ajukan Pembiayaan!', cancelButtonText: 'Batal',
      customClass: { popup: 'border border-gray-200 rounded-2xl' }
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Membuat Enkripsi Akad...',
          text: 'Mengamankan ID manifest produk dan berkas KTP...',
          allowOutsideClick: false,
          background: '#FFF', color: '#374151', didOpen: () => { Swal.showLoading(); }
        });

        try {
          const productId = selectedProduct.id || selectedProduct._id;
          
          const formData = new FormData();
          formData.append('type', 'product');
          formData.append('product_id', productId.toString());
          formData.append('product_price', productPrice.toString());
          formData.append('tenure_month', '6');
          formData.append('interest_rate', '5');
          formData.append('reason', `Peminjaman aset inventaris gadget ${displayName}`);
          formData.append('full_name_applicant', fullNameApplicant.trim());
          formData.append('nik', nik.trim());
          formData.append('phone_number', phoneNumber.trim());
          formData.append('payment_method', paymentMethod);
          formData.append('id_card', idCardFile);

          await createLoan(formData, token);

          Swal.fire({
            title: 'Akad Sukses Diajukan!',
            text: 'Notifikasi permintaan verifikasi inventaris telah diteruskan ke Gmail admin.',
            icon: 'success',
            background: '#FFF', color: '#374151', confirmButtonColor: '#3b82f6',
            customClass: { popup: 'border border-gray-200 rounded-2xl' }
          });

          setSelectedProduct(null);
          resetForm();
          loadLoansAndProfile();
        } catch (error) {
          Swal.fire({
            title: 'Gagal Memproses!',
            text: error.response?.data?.message || error.response?.data?.error || 'Ada kendala spesifikasi atau alokasi produk di backend.',
            icon: 'error',
            background: '#FFF', color: '#374151', confirmButtonColor: '#EF4444'
          });
        }
      }
    });
  };

  const handleBayarCicilan = (loanItem) => {
    const nominalTagihan = Number(loanItem.monthly_payment) || 0;
    const idKontrak = String(loanItem.id || loanItem._id).slice(-6).toUpperCase();
    const loanId = loanItem.id || loanItem._id;

    console.log("=== PROSES PEMBAYARAN DIKLIK ===");
    console.log("ID Pinjaman Asli:", loanId);
    console.log("Saldo Lokal Frontend (userBalance):", userBalance);
    console.log("Nominal Aturan Tagihan:", nominalTagihan);

    Swal.fire({
      title: 'Konfirmasi Pembayaran',
      html: `<div class="text-left text-sm space-y-3 text-gray-700">
              <p>Apakah Anda yakin ingin membayar cicilan bulanan untuk kontrak <b class="text-gray-900">#${idKontrak}</b>?</p>
              <div class="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <span class="text-xs text-gray-500 block">Total Potongan Dana:</span>
                <span class="text-lg font-black text-orange-500">${formatRupiah(nominalTagihan)}</span>
              </div>
             </div>`,
      icon: 'warning',
      showCancelButton: true,
      background: '#FFF', color: '#374151', confirmButtonColor: '#f97316', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Bayar Sekarang ⚡', cancelButtonText: 'Batal',
      customClass: { popup: 'border border-gray-200 rounded-2xl' }
    }).then(async (result) => {
      if (result.isConfirmed) {
        
        if (userBalance < nominalTagihan) {
          Swal.fire({
            title: 'Pembayaran Gagal!',
            text: `Maaf saldo anda kurang boskuh! (Saldo Sistem: ${formatRupiah(userBalance)} | Tagihan: ${formatRupiah(nominalTagihan)})`,
            icon: 'error',
            background: '#FFF', color: '#374151', confirmButtonColor: '#EF4444'
          });
          return;
        }

        Swal.fire({
          title: 'Memproses Pembayaran...',
          text: 'Memotong saldo Anda dan memperbarui data transaksi di database Supabase...',
          allowOutsideClick: false,
          background: '#FFF', color: '#374151', didOpen: () => { Swal.showLoading(); }
        });

        try {
          
          await payLoanInstallment(loanId, token);

          Swal.fire({
            title: 'Pembayaran Berhasil! 🎉',
            text: 'Saldo terpotong otomatis dan tenor cicilan berhasil ter-update.',
            icon: 'success',
            background: '#FFF', color: '#374151', confirmButtonColor: '#f97316',
            customClass: { popup: 'border border-gray-200 rounded-2xl' }
          });

          loadLoansAndProfile();
          if (refreshUser) refreshUser();
        } catch (error) {
          console.error("[ERROR API SUPABASE] Gagal eksekusi:", error.response || error);
          Swal.fire({
            title: 'Gagal Memproses Pembayaran!',
            text: error.response?.data?.error || error.response?.data?.message || 'Terjadi kesalahan sistem saat memproses pemindahan saldo di backend.',
            icon: 'error',
            background: '#FFF', color: '#374151', confirmButtonColor: '#EF4444'
          });
        }
      }
    });
  };

  const resetForm = () => {
    setFullNameApplicant('');
    setNik('');
    setPhoneNumber('');
    setIdCardFile(null);
  };

  const pendingLoans = loans.filter(l => {
    const statusClean = String(l.status || '').toLowerCase().trim();
    return statusClean === 'pending' || statusClean === 'rejected';
  });

  const activeLoans = loans.filter(l => {
    const statusClean = String(l.status || '').toLowerCase().trim();
    return statusClean === 'approved' || statusClean === 'active';
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-500 text-gray-600">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-2">
            <CalendarRange className="text-orange-500" size={26} /> PANEL KREDIT & PEMBIAYAAN DIGITAL
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Isi verifikasi identitas fisik, pantau status pengajuan real-time, dan cek tanggal jatuh tempo cicilan otomatis terintegrasi Gmail.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
          <User className="text-orange-500" size={18} />
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Langkah 1: Lengkapi Berkas Pengajuan Fisik</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 block mb-1.5">Nama Lengkap Sesuai KTP</label>
            <input 
              type="text" 
              value={fullNameApplicant} 
              onChange={e => setFullNameApplicant(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-orange-500 transition-colors text-gray-900"
              placeholder="Masukkan nama asli" 
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 block mb-1.5">Nomor NIK KTP (16 Digit)</label>
            <input 
              type="text" 
              maxLength={16}
              value={nik} 
              onChange={e => setNik(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-orange-500 transition-colors font-mono text-gray-900" 
              placeholder="320xxxxxxxxxxxxx"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 block mb-1.5">No. WhatsApp Aktif</label>
            <input 
              type="text" 
              maxLength={12}
              value={phoneNumber} 
              onChange={e => {
                const raw = e.target.value.replace(/\D/g, '');
                if (raw === '' || raw === '0') {
                  setPhoneNumber(raw);
                } else if (!raw.startsWith('08')) {
                  setPhoneNumber('08' + raw.replace(/^0+/, ''));
                } else {
                  setPhoneNumber(raw);
                }
              }}
              className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-orange-500 transition-colors text-gray-900" 
              placeholder="081234567890"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 block mb-1.5">Metode Pencairan & Angsuran</label>
            <div className="relative">
              <CreditCard size={16} className="absolute left-3 top-3.5 text-gray-400" />
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-500 text-gray-600 font-bold"
              >
                <optgroup label="⚡ E-Wallet Platform">
                  <option value="DANA">DANA Premium</option>
                  <option value="OVO">OVO Cash</option>
                  <option value="SHOPEEPAY">ShopeePay</option>
                </optgroup>
                <optgroup label="🏦 Bank Transfer (VA)">
                  <option value="BCA">Bank Central Asia (BCA)</option>
                  <option value="MANDIRI">Bank Mandiri</option>
                  <option value="BRI">Bank Rakyat Indonesia (BRI)</option>
                  <option value="BNI">Bank Negara Indonesia (BNI)</option>
                  <option value="SEABANK">SeaBank Digital</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 block mb-1.5">Upload Foto KTP Asli</label>
            <div className="border border-dashed border-gray-200 hover:border-orange-500/40 rounded-xl p-2.5 relative bg-gray-50/50 transition-colors flex items-center justify-center cursor-pointer min-h-11.5">
              <input 
                type="file" 
                accept="image/*" 
                onChange={e => setIdCardFile(e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
              />
              <div className="flex items-center gap-2 text-xs">
                <Upload size={14} className="text-gray-400" />
                <span className="text-gray-500 font-medium">
                  {idCardFile ? `Selected: ${idCardFile.name}` : 'Pilih file gambar KTP bos (Max 5MB)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl border border-orange-200">
                <Banknote size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 uppercase tracking-wide">Fasilitas Pinjaman Uang</h3>
                <p className="text-[11px] text-gray-500">Bunga flat ringan 5% untuk modal ekspansi bisnismu.</p>
              </div>
            </div>

            <form onSubmit={handleCash} className="space-y-4 mt-6">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 block mb-1.5">Jumlah Dana (IDR)</label>
                <div className="relative">
                  <Coins size={16} className="absolute left-3 top-3.5 text-gray-400" />
                  <input 
                    type="number" 
                    value={cashAmount} 
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 block mb-1.5">Tenor Pembayaran</label>
                <select 
                  value={tenureMonth} 
                  onChange={(e) => setTenureMonth(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value={3}>3 Bulan</option>
                  <option value={6}>6 Bulan</option>
                  <option value={12}>12 Bulan</option>
                </select>
              </div>
            </form>
          </div>

          <button 
            onClick={handleCash}
            className="w-full mt-6 py-3.5 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
          >
            Cairkan Dana Sekarang <ArrowUpRight size={16} />
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                <Package size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 uppercase tracking-wide">Pinjam Inventaris Barang</h3>
                <p className="text-[11px] text-gray-500">Pilih unit gadget mewah yang tersedia langsung di database.</p>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 block mb-1.5">Pilih Aset Gadget</label>
                <select 
                  onChange={(e) => {
                    const productId = e.target.value;
                    const product = products.find(p => (p.id || p._id) === productId);
                    setSelectedProduct(product);
                  }}
                  value={selectedProduct ? (selectedProduct.id || selectedProduct._id) : ""}
                  className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm text-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">-- Silakan Pilih Gadget --</option>
                  {products.map(p => {
                    const name = p.description || p.name || 'Premium Item';
                    return (
                      <option key={p.id || p._id} value={p.id || p._id}>
                        {name} - {formatRupiah(p.price || 0)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedProduct && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 animate-in fade-in duration-300">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Estimasi Angsuran Pembiayaan</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tenor Tetap:</span>
                    <span className="text-gray-900 font-semibold">6 Bulan</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600 font-bold">
                      {formatRupiah(Math.round(((selectedProduct.price || 0) / 6) + ((selectedProduct.price || 0) * 0.05)))} / Bln
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleProduct}
            className="w-full mt-6 py-3.5 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Package size={16} /> Ajukan Pinjam Barang
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-orange-500" size={18} />
          <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider">🔒 KONTRAK PINJAMAN AKTIF & JATUH TEMPO</h3>
        </div>

        <div className="bg-white border border-orange-200 rounded-2xl overflow-hidden shadow-2xl">
          {activeLoans.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center justify-center gap-2 bg-orange-50">
              <Clock size={28} className="text-gray-400" />
              <span>Belum ada pinjaman yang di-approve oleh admin. Cicilan aktif kamu akan tampil di sini boskuh.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    <th className="p-3 lg:p-4">ID Kontrak</th>
                    <th className="p-3 lg:p-4">Tanggal Akad</th>
                    <th className="p-3 lg:p-4">Deskripsi Dana / Produk</th>
                    <th className="p-3 lg:p-4">Angsuran / Bulan</th>
                    <th className="p-3 lg:p-4">Sisa Tagihan</th>
                    <th className="p-3 lg:p-4 text-rose-500"><span className="flex items-center gap-1"><Calendar size={12}/> Jatuh Tempo</span></th>
                    <th className="p-3 lg:p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
                  {activeLoans.map((l) => {
                    const isCash = l.type === 'cash';

                    const calculatedTotal = Number(l.monthly_payment) * Number(l.tenure_month || 6);
                    const sisaTagihanUang = (l.remaining_amount !== null && l.remaining_amount !== undefined && l.remaining_amount > 0)
                      ? Number(l.remaining_amount)
                      : calculatedTotal;

                    const isLunas = sisaTagihanUang <= 0;

                    return (
                      <tr key={l.id || l._id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 lg:p-4 font-mono text-xs text-gray-400 font-bold">
                          #{String(l.id || l._id).slice(-6).toUpperCase()}
                        </td>
                        <td className="p-3 lg:p-4 text-xs font-medium text-gray-500 whitespace-nowrap">
                          {formatIndonesianDate(l.created_at)}
                        </td>
                        <td className="p-3 lg:p-4 min-w-0">
                          <div className="font-bold text-gray-900 text-xs lg:text-sm">
                            {isCash ? '💵 Dana Tunai Eksklusif' : `📦 ${l.products?.description || 'Unit Gadget Premium'}`}
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono block uppercase">Via {l.payment_method}</span>
                        </td>
                        <td className="p-3 lg:p-4 text-orange-500 font-bold text-xs lg:text-sm whitespace-nowrap">
                          {formatRupiah(l.monthly_payment)} <span className="text-[10px] text-gray-400 font-normal">/ bln</span>
                        </td>
                        <td className="p-3 lg:p-4 text-gray-900 font-mono font-bold text-xs lg:text-sm whitespace-nowrap">
                          {formatRupiah(sisaTagihanUang)}
                        </td>
                        <td className="p-3 lg:p-4 font-bold text-rose-500 text-xs whitespace-nowrap">
                          {calculateNextDueDate(l)}
                        </td>
                        <td className="p-3 lg:p-4 text-right">
                          <button
                            onClick={() => handleBayarCicilan(l)}
                            disabled={isLunas}
                            className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-lg group ${isLunas ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-linear-to-r from-orange-600 to-orange-600 hover:from-orange-500 hover:to-orange-500 text-white'}`}
                          >
                            {isLunas ? 'Lunas 🎉' : 'Bayar Sekarang'}
                            {!isLunas && <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="text-gray-500" size={18} />
          <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider">📋 MANIFEST ANTREAN BERKAS VERIFIKASI</h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xl">
          {pendingLoans.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center justify-center gap-2">
              <HelpCircle size={28} className="text-gray-400 stroke-1" />
              <span>Manifest kosong. Tidak ada berkas baru dalam peninjauan antrean admin, boskuh.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    <th className="p-3 lg:p-4">ID Berkas</th>
                    <th className="p-3 lg:p-4">Tipe Pembiayaan</th>
                    <th className="p-3 lg:p-4">Nilai Pokok Pinjaman</th>
                    <th className="p-3 lg:p-4">Tenor</th>
                    <th className="p-3 lg:p-4 text-right">Status Keputusan Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
                  {pendingLoans.map((l) => {
                    const isCash = l.type === 'cash';
                    const isRejected = l.status === 'rejected';
                    return (
                      <tr key={l.id || l._id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 lg:p-4 font-mono text-xs text-gray-400">
                          #{String(l.id || l._id).slice(-6).toUpperCase()}
                        </td>
                        <td className="p-3 lg:p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${isCash ? 'bg-orange-50 text-orange-500 border-orange-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                            {isCash ? 'Cash Financing' : 'Product Financing'}
                          </span>
                        </td>
                        <td className="p-3 lg:p-4 font-bold text-gray-600 text-xs lg:text-sm whitespace-nowrap">
                          {isCash ? formatRupiah(l.loan_amount) : formatRupiah(l.products?.price || l.loan_amount || 0)}
                        </td>
                        <td className="p-3 lg:p-4 text-gray-500 font-medium text-xs lg:text-sm">
                          {l.tenure_month || 6} Bulan
                        </td>
                        <td className="p-3 lg:p-4 text-right">
                          <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full border ${isRejected ? 'bg-red-50 text-rose-500 border-rose-200' : 'bg-amber-50 text-amber-500 border-amber-200'}`}>
                            {isRejected ? (
                              <><AlertCircle size={11} /> Ditolak Admin</>
                            ) : (
                              <><Clock size={11} /> Menunggu ACC</>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
