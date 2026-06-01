// components/LoginModal.js
import { useState } from 'react';
import { X, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginModal({ onClose, onSuccess, product }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Selamat datang, ${data.player.username}!`);
        onSuccess(data.player);
      } else {
        setError(data.message || 'Login gagal. Periksa username dan password kamu.');
      }
    } catch (err) {
      setError('Gagal terhubung ke server. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="relative w-full max-w-md bg-dark-3 rounded-2xl overflow-hidden border border-orange-500/20"
        style={{ boxShadow: '0 0 60px rgba(249,115,22,0.15)' }}>

        {/* Header gradient */}
        <div className="h-1 w-full" style={{
          background: 'linear-gradient(90deg, #f97316, #f59e0b, #f97316)',
        }} />

        {/* Close button */}
        <button onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10">
          <X size={20} />
        </button>

        <div className="p-8">
          {/* Icon & Title */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">⚔️</div>
            <h2 className="font-display text-2xl font-bold text-white">Login Minecraft</h2>
            <p className="text-gray-500 font-body text-sm mt-2">
              Gunakan username & password akun Minecraft kamu di server
            </p>
          </div>

          {/* Product Info jika ada */}
          {product && (
            <div className="mb-5 p-3 bg-dark-4 rounded-xl border border-orange-500/10 flex items-center gap-3">
              <span className="text-2xl">🛒</span>
              <div>
                <div className="text-xs text-orange-400 font-ui tracking-wider">Kamu ingin membeli:</div>
                <div className="text-sm font-bold text-white font-body">{product.name}</div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2">
              <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <span className="text-red-400 font-body text-sm">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-ui tracking-widest text-gray-400 mb-2 uppercase">
                Username Minecraft
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username kamu"
                className="input-dark w-full px-4 py-3 rounded-xl font-body"
                autoComplete="username"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-ui tracking-widest text-gray-400 mb-2 uppercase">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password kamu di server"
                  className="input-dark w-full px-4 py-3 pr-12 rounded-xl font-body"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-400 transition-colors">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="btn-primary w-full rounded-xl py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <>
                  <div className="spinner !w-5 !h-5" />
                  <span>Memeriksa...</span>
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Masuk ke Store</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-gray-600 font-body text-xs mt-4 leading-relaxed">
            Password yang digunakan adalah password <strong className="text-orange-400">/register</strong> atau <strong className="text-orange-400">/login</strong> di server Minecraft
          </p>
        </div>
      </div>
    </div>
  );
}
