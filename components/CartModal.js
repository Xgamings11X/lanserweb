// components/CartModal.js
import { useState } from 'react';
import { X, CreditCard, Shield, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CartModal({ product, player, onClose }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('confirm'); // confirm | paying | success

  const price = new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(product.price);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productId: product.id,
          playerUsername: player.username,
          playerUuid: player.uuid,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Gagal membuat order');
        return;
      }

      // Load Midtrans Snap
      if (data.snapToken) {
        setStep('paying');

        // Load Midtrans snap.js
        const snapUrl = process.env.NEXT_PUBLIC_MIDTRANS_ENV === 'production'
          ? 'https://app.midtrans.com/snap/snap.js'
          : 'https://app.sandbox.midtrans.com/snap/snap.js';

        // Load script jika belum ada
        if (!document.getElementById('midtrans-snap')) {
          await new Promise((resolve) => {
            const script = document.createElement('script');
            script.id = 'midtrans-snap';
            script.src = snapUrl;
            script.setAttribute('data-client-key', data.clientKey);
            script.onload = resolve;
            document.head.appendChild(script);
          });
        }

        window.snap.pay(data.snapToken, {
          onSuccess: async (result) => {
            toast.success('Pembayaran berhasil! Item sedang dikirim ke Minecraft kamu 🎉');
            setStep('success');
            // Verifikasi pembayaran
            await fetch(`/api/orders/verify/${data.orderId}`, { credentials: 'include' });
          },
          onPending: (result) => {
            toast('Pembayaran pending. Selesaikan dalam 24 jam.', { icon: '⏳' });
            onClose();
          },
          onError: (result) => {
            toast.error('Pembayaran gagal. Coba lagi.');
            setStep('confirm');
          },
          onClose: () => {
            setStep('confirm');
          },
        });
      }
    } catch (err) {
      toast.error('Terjadi kesalahan. Coba lagi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget && step !== 'paying') onClose(); }}>

      <div className="relative w-full max-w-md bg-dark-3 rounded-2xl overflow-hidden border border-orange-500/20"
        style={{ boxShadow: '0 0 60px rgba(249,115,22,0.15)' }}>

        <div className="h-1 w-full" style={{
          background: 'linear-gradient(90deg, #f97316, #f59e0b, #f97316)',
        }} />

        {step !== 'paying' && (
          <button onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10">
            <X size={20} />
          </button>
        )}

        <div className="p-8">
          {/* SUCCESS STATE */}
          {step === 'success' ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">Pembayaran Berhasil!</h2>
              <p className="text-gray-400 font-body text-sm mb-2">
                Item <strong className="text-orange-400">{product.name}</strong> sedang dikirim ke akun Minecraft kamu
              </p>
              <p className="text-gray-500 font-body text-xs mb-6">
                Login ke server dan cek inventory kamu. Jika belum muncul dalam 5 menit, hubungi admin.
              </p>
              <button onClick={onClose} className="btn-primary rounded-xl px-8 py-3">
                Selesai
              </button>
            </div>
          ) : step === 'paying' ? (
            /* PAYING STATE */
            <div className="text-center">
              <div className="spinner mx-auto mb-4 !w-10 !h-10" />
              <h2 className="font-display text-xl font-bold text-white mb-2">Memproses Pembayaran...</h2>
              <p className="text-gray-400 font-body text-sm">
                Jangan tutup halaman ini. Selesaikan pembayaran di popup Midtrans.
              </p>
            </div>
          ) : (
            /* CONFIRM STATE */
            <>
              <div className="text-center mb-6">
                <h2 className="font-display text-2xl font-bold text-white">Konfirmasi Pembelian</h2>
              </div>

              {/* Product Summary */}
              <div className="bg-dark-4 rounded-xl p-4 mb-5 border border-orange-500/10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-dark-3 rounded-xl flex items-center justify-center text-3xl">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-10 h-10 object-contain" />
                    ) : (
                      product.category_slug === 'rank' ? '👑' :
                      product.category_slug === 'weapon' ? '⚔️' :
                      product.category_slug === 'sellwand' ? '🪄' : '📦'
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-orange-400 font-ui tracking-wider uppercase mb-1">
                      {product.category_name}
                    </div>
                    <div className="font-bold text-white font-body">{product.name}</div>
                  </div>
                  <div className="font-display text-xl font-bold"
                    style={{ color: '#f97316' }}>
                    {price}
                  </div>
                </div>
              </div>

              {/* Player Info */}
              <div className="bg-dark-4 rounded-xl p-4 mb-5 border border-green-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Shield size={16} className="text-green-400" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-ui tracking-wider">Dikirim ke akun</div>
                    <div className="font-bold text-white font-body">{player.username}</div>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mb-5">
                <div className="text-xs font-ui tracking-widest text-gray-500 uppercase mb-3">Metode Pembayaran</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: '📱', name: 'QRIS', desc: 'Semua e-wallet' },
                    { icon: '🏦', name: 'Transfer', desc: 'Bank BCA/BNI/BRI' },
                    { icon: '💚', name: 'GoPay', desc: 'GoPay / OVO' },
                  ].map((m, i) => (
                    <div key={i} className="bg-dark-4 border border-orange-500/10 rounded-xl p-3 text-center">
                      <div className="text-xl mb-1">{m.icon}</div>
                      <div className="text-xs font-ui font-bold text-white">{m.name}</div>
                      <div className="text-xs text-gray-600 font-body">{m.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="flex items-start gap-2 mb-5 p-3 bg-orange-500/5 border border-orange-500/10 rounded-xl">
                <Clock size={14} className="text-orange-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-400 font-body leading-relaxed">
                  Item akan otomatis dikirim ke Minecraft kamu setelah pembayaran dikonfirmasi (biasanya instan).
                </p>
              </div>

              {/* Total & Buy */}
              <div className="flex items-center justify-between mb-4">
                <span className="font-ui text-gray-400 tracking-wider">Total Pembayaran</span>
                <span className="font-display text-2xl font-bold" style={{ color: '#f97316' }}>{price}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="btn-primary w-full rounded-xl py-4 flex items-center justify-center gap-2 text-base disabled:opacity-50">
                {loading ? (
                  <><div className="spinner !w-5 !h-5" /> Memproses...</>
                ) : (
                  <><CreditCard size={18} /> Bayar Sekarang</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
