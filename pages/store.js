// pages/store.js - Halaman Store Utama
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { getSettings } from '../lib/settings';
import { query } from '../lib/db';
import LoginModal from '../components/LoginModal';
import ProductCard from '../components/ProductCard';
import CartModal from '../components/CartModal';
import Navbar from '../components/Navbar';

export async function getServerSideProps() {
  try {
    const settings = await getSettings();
    const categories = await query(
      'SELECT * FROM store_categories WHERE is_active = 1 ORDER BY sort_order ASC'
    );
    const products = await query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug 
       FROM store_products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.is_active = 1 
       ORDER BY p.sort_order ASC`
    );

    return {
      props: {
        settings,
        categories: JSON.parse(JSON.stringify(categories)),
        products: JSON.parse(JSON.stringify(products)),
      },
    };
  } catch (e) {
    console.error(e);
    return { props: { settings: {}, categories: [], products: [] } };
  }
}

export default function StorePage({ settings, categories, products }) {
  const router = useRouter();
  const s = settings;

  const [activeCategory, setActiveCategory] = useState('all');
  const [showLogin, setShowLogin] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [player, setPlayer] = useState(null);
  const [cartItem, setCartItem] = useState(null);

  // Check jika ada redirect setelah payment
  useEffect(() => {
    const { order, status } = router.query;
    if (order && status) {
      if (status === 'success') toast.success('Pembayaran berhasil! Cek inventory Minecraft kamu.');
      if (status === 'error') toast.error('Pembayaran gagal. Silakan coba lagi.');
      if (status === 'pending') toast('Pembayaran pending. Selesaikan pembayaran sebelum 24 jam.', { icon: '⏳' });
    }
  }, [router.query]);

  // Cek session login
  useEffect(() => {
    const playerData = localStorage.getItem('mc_player');
    if (playerData) {
      try { setPlayer(JSON.parse(playerData)); } catch {}
    }
  }, []);

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category_slug === activeCategory);

  const handleBuy = (product) => {
    if (!player) {
      setSelectedProduct(product);
      setShowLogin(true);
    } else {
      setCartItem(product);
      setShowCart(true);
    }
  };

  const handleLoginSuccess = (playerData) => {
    setPlayer(playerData);
    localStorage.setItem('mc_player', JSON.stringify(playerData));
    setShowLogin(false);
    if (selectedProduct) {
      setCartItem(selectedProduct);
      setShowCart(true);
      setSelectedProduct(null);
    }
  };

  const handleLogout = () => {
    setPlayer(null);
    localStorage.removeItem('mc_player');
    document.cookie = 'token=; Max-Age=0; path=/';
    toast.success('Berhasil logout');
  };

  const serverName = s.server_name || 'NusaCraft';

  return (
    <>
      <Head>
        <title>Store — {serverName}</title>
        <meta name="description" content={`Beli rank, senjata, dan item eksklusif di ${serverName}`} />
      </Head>

      <div className="grid-overlay" />

      <div className="relative z-10 min-h-screen">
        <Navbar
          settings={s}
          player={player}
          onLogout={handleLogout}
          onLoginClick={() => setShowLogin(true)}
        />

        {/* Store Header */}
        <div className="relative pt-24 pb-8 px-4 text-center"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.12) 0%, transparent 70%)',
          }}>
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="diamond-deco" />
            <span className="font-ui text-orange-400 tracking-[0.3em] text-xs uppercase">Toko Item</span>
            <div className="diamond-deco" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-3">
            <span style={{ color: '#f97316' }}>{serverName}</span> Store
          </h1>
          <p className="text-gray-400 font-body max-w-md mx-auto">
            Semua pembelian langsung otomatis dikirim ke karakter Minecraft kamu
          </p>

          {/* Player status bar */}
          {player && (
            <div className="mt-4 inline-flex items-center gap-3 bg-dark-3 border border-green-500/30 rounded-xl px-4 py-2">
              <img
                src={`https://crafatar.com/avatars/${player.uuid || player.username}?size=24&overlay`}
                alt={player.username}
                className="w-6 h-6 rounded"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span className="text-green-400 font-ui text-sm">Logged in as <strong>{player.username}</strong></span>
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <div className="sticky top-16 z-30 bg-dark/90 backdrop-blur-md border-b border-orange-500/10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
              <button
                onClick={() => setActiveCategory('all')}
                className={`flex-shrink-0 px-5 py-2 rounded-lg font-ui text-sm tracking-wider transition-all ${
                  activeCategory === 'all'
                    ? 'bg-orange-500 text-black font-bold'
                    : 'bg-dark-3 text-gray-400 hover:text-orange-400 border border-orange-500/10 hover:border-orange-500/30'
                }`}>
                🏪 Semua
              </button>
              {categories.map(cat => (
                <button
                  key={cat.slug}
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`flex-shrink-0 px-5 py-2 rounded-lg font-ui text-sm tracking-wider transition-all whitespace-nowrap ${
                    activeCategory === cat.slug
                      ? 'bg-orange-500 text-black font-bold'
                      : 'bg-dark-3 text-gray-400 hover:text-orange-400 border border-orange-500/10 hover:border-orange-500/30'
                  }`}>
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="max-w-7xl mx-auto px-4 py-10">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-500 font-ui text-lg tracking-wider">Belum ada produk di kategori ini</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onBuy={handleBuy}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-orange-500/10 py-8 text-center mt-10">
          <Link href="/" className="text-orange-400 hover:text-orange-300 font-ui text-sm tracking-widest">
            ← KEMBALI KE BERANDA
          </Link>
          <p className="text-gray-600 font-body text-xs mt-2">
            {s.footer_text || `© 2024 ${serverName}`}
          </p>
        </footer>
      </div>

      {/* Modals */}
      {showLogin && (
        <LoginModal
          onClose={() => { setShowLogin(false); setSelectedProduct(null); }}
          onSuccess={handleLoginSuccess}
          product={selectedProduct}
        />
      )}
      {showCart && cartItem && (
        <CartModal
          product={cartItem}
          player={player}
          onClose={() => { setShowCart(false); setCartItem(null); }}
        />
      )}
    </>
  );
}
