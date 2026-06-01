// pages/admin/index.js - Admin Dashboard
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Package, FolderOpen, Settings2, ShoppingBag,
  LogOut, Plus, Edit2, Trash2, Save, X, Eye, EyeOff, RefreshCw,
  Sword, Star, TrendingUp, Users, CheckCircle, Clock, XCircle,
  ChevronRight, Menu, AlertTriangle
} from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Produk', icon: Package },
  { id: 'categories', label: 'Kategori', icon: FolderOpen },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

export default function AdminPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState({});
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, revenue: 0 });
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    // Cek session admin
    const token = localStorage.getItem('admin_token');
    if (token) setIsLoggedIn(true);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard' || activeTab === 'products') {
        const r = await adminFetch('/api/admin/products');
        if (r.success) setProducts(r.products);
      }
      if (activeTab === 'dashboard' || activeTab === 'categories') {
        const r = await adminFetch('/api/admin/categories');
        if (r.success) setCategories(r.categories);
      }
      if (activeTab === 'dashboard' || activeTab === 'orders') {
        const r = await adminFetch('/api/admin/orders');
        if (r.success) {
          setOrders(r.orders);
          const paid = r.orders.filter(o => o.payment_status === 'paid');
          const pending = r.orders.filter(o => o.payment_status === 'pending');
          const revenue = paid.reduce((sum, o) => sum + parseInt(o.amount || 0), 0);
          setStats({ total: r.orders.length, paid: paid.length, pending: pending.length, revenue });
        }
      }
      if (activeTab === 'settings') {
        const r = await adminFetch('/api/admin/settings');
        if (r.success) setSettings(r.settings);
      }
    } catch {}
    setLoading(false);
  };

  async function adminFetch(url, options = {}) {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      credentials: 'include',
    });
    return res.json();
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('admin_token', data.token);
        setIsLoggedIn(true);
        toast.success('Login berhasil!');
      } else {
        toast.error(data.message || 'Login gagal');
      }
    } catch {
      toast.error('Server error');
    }
    setLoginLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    document.cookie = 'admin_token=; Max-Age=0; path=/';
    setIsLoggedIn(false);
    toast.success('Logout berhasil');
  };

  const saveSettings = async () => {
    const r = await adminFetch('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify({ settings }),
    });
    if (r.success) toast.success('Settings disimpan!');
    else toast.error('Gagal menyimpan');
  };

  const deleteProduct = async (id) => {
    if (!confirm('Hapus produk ini?')) return;
    const r = await adminFetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
    if (r.success) { toast.success('Produk dihapus'); loadData(); }
  };

  const deleteCategory = async (id) => {
    if (!confirm('Hapus kategori ini?')) return;
    const r = await adminFetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
    if (r.success) { toast.success('Kategori dihapus'); loadData(); }
  };

  const executeCommands = async (orderId) => {
    const r = await adminFetch('/api/admin/orders', {
      method: 'POST',
      body: JSON.stringify({ orderId, action: 'execute_commands' }),
    });
    if (r.success) { toast.success('Commands dieksekusi!'); loadData(); }
    else toast.error('Gagal eksekusi commands');
  };

  // ====================================
  // LOGIN SCREEN
  // ====================================
  if (!isLoggedIn) {
    return (
      <>
        <Head><title>Admin Login — Store</title></Head>
        <div className="grid-overlay" />
        <div className="min-h-screen flex items-center justify-center relative z-10 px-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="font-display text-3xl font-bold text-orange-500 mb-2">⚙️ Admin Panel</div>
              <p className="text-gray-500 font-body text-sm">Login untuk mengelola store</p>
            </div>

            <form onSubmit={handleLogin}
              className="bg-dark-3 border border-orange-500/20 rounded-2xl p-8"
              style={{ boxShadow: '0 0 40px rgba(249,115,22,0.1)' }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-ui tracking-widest text-gray-400 mb-2 uppercase">Username Admin</label>
                  <input
                    type="text" value={loginForm.username}
                    onChange={e => setLoginForm(p => ({ ...p, username: e.target.value }))}
                    className="input-dark w-full px-4 py-3 rounded-xl font-body"
                    placeholder="admin" required
                  />
                </div>
                <div>
                  <label className="block text-xs font-ui tracking-widest text-gray-400 mb-2 uppercase">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'} value={loginForm.password}
                      onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                      className="input-dark w-full px-4 py-3 pr-12 rounded-xl font-body"
                      placeholder="••••••••" required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-400">
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loginLoading}
                  className="btn-primary w-full rounded-xl py-3.5 mt-2">
                  {loginLoading ? 'Loading...' : 'Masuk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </>
    );
  }

  // ====================================
  // ADMIN DASHBOARD
  // ====================================
  return (
    <>
      <Head><title>Admin Panel — Store</title></Head>
      <div className="grid-overlay" />
      <div className="relative z-10 flex min-h-screen">

        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-dark-2 border-r border-orange-500/10 flex flex-col flex-shrink-0`}>
          {/* Logo */}
          <div className="p-4 border-b border-orange-500/10 flex items-center gap-3">
            <div className="diamond-deco flex-shrink-0" style={{ width: 10, height: 10 }} />
            {sidebarOpen && (
              <span className="font-display text-lg font-bold text-orange-500 truncate">Admin Panel</span>
            )}
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="ml-auto text-gray-500 hover:text-orange-400 flex-shrink-0">
              <Menu size={18} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-ui text-sm tracking-wider ${
                    activeTab === tab.id
                      ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-dark-3'
                  }`}>
                  <Icon size={16} className="flex-shrink-0" />
                  {sidebarOpen && <span className="truncate">{tab.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-orange-500/10">
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all font-ui text-sm">
              <LogOut size={16} className="flex-shrink-0" />
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Topbar */}
          <div className="sticky top-0 z-20 bg-dark-2/90 backdrop-blur border-b border-orange-500/10 px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl font-bold text-white">
                {TABS.find(t => t.id === activeTab)?.label}
              </h1>
            </div>
            <button onClick={loadData}
              className="flex items-center gap-2 btn-secondary rounded-lg px-3 py-2 text-xs">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          <div className="p-6 space-y-6">

            {/* =================== DASHBOARD =================== */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Orders', value: stats.total, icon: ShoppingBag, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Berhasil', value: stats.paid, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
                    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                    { label: 'Revenue', value: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.revenue), icon: TrendingUp, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                  ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <div key={i} className="bg-dark-3 border border-orange-500/10 rounded-xl p-4">
                        <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                          <Icon size={18} className={stat.color} />
                        </div>
                        <div className="font-display text-2xl font-bold text-white">{stat.value}</div>
                        <div className="font-ui text-xs text-gray-500 tracking-wider mt-1">{stat.label}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-dark-3 border border-orange-500/10 rounded-xl p-4">
                    <h3 className="font-ui font-bold text-white mb-3 tracking-wider text-sm">Produk Terbaru</h3>
                    {products.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center justify-between py-2 border-b border-dark-4 last:border-0">
                        <span className="font-body text-sm text-gray-300 truncate">{p.name}</span>
                        <span className="font-ui text-xs text-orange-400 ml-2 flex-shrink-0">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-dark-3 border border-orange-500/10 rounded-xl p-4">
                    <h3 className="font-ui font-bold text-white mb-3 tracking-wider text-sm">Order Terbaru</h3>
                    {orders.slice(0, 5).map(o => (
                      <div key={o.id} className="flex items-center justify-between py-2 border-b border-dark-4 last:border-0">
                        <span className="font-body text-sm text-gray-300 truncate">{o.player_username}</span>
                        <span className={`font-ui text-xs px-2 py-0.5 rounded-full ${
                          o.payment_status === 'paid' ? 'badge-green' :
                          o.payment_status === 'pending' ? 'badge-yellow' : 'badge-red'
                        }`}>
                          {o.payment_status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* =================== PRODUCTS =================== */}
            {activeTab === 'products' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-400 font-body text-sm">{products.length} produk terdaftar</p>
                  <button onClick={() => { setEditingProduct({}); setShowProductModal(true); }}
                    className="btn-primary rounded-xl px-4 py-2 text-sm flex items-center gap-2">
                    <Plus size={14} /> Tambah Produk
                  </button>
                </div>

                <div className="bg-dark-3 border border-orange-500/10 rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-orange-500/10">
                        {['Nama', 'Kategori', 'Harga', 'Status', 'Aksi'].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-ui text-xs tracking-widest text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id} className="border-b border-dark-4 hover:bg-dark-4/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-body text-sm text-white">{p.name}</div>
                            {p.badge && <span className={`text-xs font-ui px-1.5 py-0.5 rounded ${`badge-${p.badge_color}`}`}>{p.badge}</span>}
                          </td>
                          <td className="px-4 py-3 font-body text-sm text-gray-400">{p.category_name || '-'}</td>
                          <td className="px-4 py-3 font-ui text-sm text-orange-400">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p.price)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-ui px-2 py-1 rounded-full ${p.is_active ? 'badge-green' : 'badge-red'}`}>
                              {p.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => { setEditingProduct(p); setShowProductModal(true); }}
                                className="p-1.5 hover:bg-orange-500/10 rounded-lg text-gray-400 hover:text-orange-400 transition-colors">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => deleteProduct(p.id)}
                                className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {products.length === 0 && (
                    <div className="text-center py-12 text-gray-500 font-body">Belum ada produk</div>
                  )}
                </div>
              </div>
            )}

            {/* =================== CATEGORIES =================== */}
            {activeTab === 'categories' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-400 font-body text-sm">{categories.length} kategori</p>
                  <button onClick={() => { setEditingCategory({}); setShowCategoryModal(true); }}
                    className="btn-primary rounded-xl px-4 py-2 text-sm flex items-center gap-2">
                    <Plus size={14} /> Tambah Kategori
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map(cat => (
                    <div key={cat.id} className="bg-dark-3 border border-orange-500/10 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{cat.icon}</span>
                          <div>
                            <div className="font-body font-bold text-white">{cat.name}</div>
                            <div className="text-xs text-gray-500 font-ui">/{cat.slug}</div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingCategory(cat); setShowCategoryModal(true); }}
                            className="p-1.5 hover:bg-orange-500/10 rounded-lg text-gray-400 hover:text-orange-400">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => deleteCategory(cat.id)}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      {cat.description && <p className="text-xs text-gray-500 font-body mt-2">{cat.description}</p>}
                      <span className={`mt-2 inline-block text-xs font-ui px-2 py-0.5 rounded-full ${cat.is_active ? 'badge-green' : 'badge-red'}`}>
                        {cat.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =================== ORDERS =================== */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="bg-dark-3 border border-orange-500/10 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead>
                        <tr className="border-b border-orange-500/10">
                          {['Order ID', 'Player', 'Produk', 'Harga', 'Status', 'Tanggal', 'Aksi'].map(h => (
                            <th key={h} className="px-4 py-3 text-left font-ui text-xs tracking-widest text-gray-500 uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(o => (
                          <tr key={o.id} className="border-b border-dark-4 hover:bg-dark-4/50 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-gray-400">{o.order_id}</td>
                            <td className="px-4 py-3 font-body text-sm text-white">{o.player_username}</td>
                            <td className="px-4 py-3 font-body text-sm text-gray-300 truncate max-w-[150px]">{o.product_name}</td>
                            <td className="px-4 py-3 font-ui text-sm text-orange-400">
                              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(o.amount)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-ui px-2 py-1 rounded-full ${
                                o.payment_status === 'paid' ? 'badge-green' :
                                o.payment_status === 'pending' ? 'badge-yellow' : 'badge-red'
                              }`}>
                                {o.payment_status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 font-body">
                              {new Date(o.created_at).toLocaleDateString('id-ID')}
                            </td>
                            <td className="px-4 py-3">
                              {o.payment_status === 'paid' && !o.commands_executed && (
                                <button onClick={() => executeCommands(o.order_id)}
                                  className="text-xs btn-primary rounded-lg px-2 py-1 flex items-center gap-1">
                                  <Sword size={11} /> Eksekusi
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {orders.length === 0 && (
                      <div className="text-center py-12 text-gray-500 font-body">Belum ada orders</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* =================== SETTINGS =================== */}
            {activeTab === 'settings' && (
              <div className="max-w-2xl space-y-6">
                {[
                  {
                    title: '🖥️ Server Info',
                    fields: [
                      { key: 'server_name', label: 'Nama Server', placeholder: 'NusaCraft' },
                      { key: 'server_ip', label: 'IP Server', placeholder: 'play.nusacraft.net' },
                      { key: 'server_description', label: 'Deskripsi', placeholder: 'Economy Semi RPG...' },
                      { key: 'logo_text', label: 'Logo Text', placeholder: 'NusaCraft' },
                    ],
                  },
                  {
                    title: '🔗 Links',
                    fields: [
                      { key: 'discord_url', label: 'Discord URL', placeholder: 'https://discord.gg/...' },
                      { key: 'vote_url', label: 'Vote URL', placeholder: 'https://...' },
                    ],
                  },
                  {
                    title: '🎨 Tampilan',
                    fields: [
                      { key: 'hero_title', label: 'Hero Title', placeholder: 'Selamat Datang di...' },
                      { key: 'hero_subtitle', label: 'Hero Subtitle', placeholder: 'Economy Semi RPG...' },
                      { key: 'announcement', label: 'Announcement Bar', placeholder: '🎉 Event spesial!...' },
                      { key: 'footer_text', label: 'Footer Text', placeholder: '© 2024 NusaCraft' },
                    ],
                  },
                  {
                    title: '⚡ Status',
                    fields: [
                      { key: 'players_online', label: 'Players Online', placeholder: '0', type: 'number' },
                      { key: 'server_status', label: 'Server Status', placeholder: 'online', options: ['online', 'offline', 'maintenance'] },
                    ],
                  },
                ].map(section => (
                  <div key={section.title} className="bg-dark-3 border border-orange-500/10 rounded-2xl p-5">
                    <h3 className="font-ui font-bold text-white mb-4 tracking-wider">{section.title}</h3>
                    <div className="space-y-4">
                      {section.fields.map(field => (
                        <div key={field.key}>
                          <label className="block text-xs font-ui tracking-widest text-gray-400 mb-2 uppercase">
                            {field.label}
                          </label>
                          {field.options ? (
                            <select
                              value={settings[field.key] || ''}
                              onChange={e => setSettings(p => ({ ...p, [field.key]: e.target.value }))}
                              className="input-dark w-full px-4 py-2.5 rounded-xl font-body">
                              {field.options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type || 'text'}
                              value={settings[field.key] || ''}
                              onChange={e => setSettings(p => ({ ...p, [field.key]: e.target.value }))}
                              placeholder={field.placeholder}
                              className="input-dark w-full px-4 py-2.5 rounded-xl font-body"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <button onClick={saveSettings}
                  className="btn-primary rounded-xl px-8 py-3 flex items-center gap-2">
                  <Save size={16} /> Simpan Semua Settings
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => { setShowProductModal(false); setEditingProduct(null); }}
          onSave={async (data) => {
            const isEdit = data.id;
            const r = await adminFetch('/api/admin/products', {
              method: isEdit ? 'PUT' : 'POST',
              body: JSON.stringify(data),
            });
            if (r.success) {
              toast.success(isEdit ? 'Produk diupdate!' : 'Produk ditambahkan!');
              setShowProductModal(false);
              loadData();
            } else {
              toast.error(r.message || 'Gagal menyimpan');
            }
          }}
        />
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => { setShowCategoryModal(false); setEditingCategory(null); }}
          onSave={async (data) => {
            const isEdit = data.id;
            const r = await adminFetch('/api/admin/categories', {
              method: isEdit ? 'PUT' : 'POST',
              body: JSON.stringify(data),
            });
            if (r.success) {
              toast.success(isEdit ? 'Kategori diupdate!' : 'Kategori ditambahkan!');
              setShowCategoryModal(false);
              loadData();
            } else {
              toast.error(r.message || 'Gagal menyimpan');
            }
          }}
        />
      )}
    </>
  );
}

// ===================== PRODUCT MODAL =====================
function ProductModal({ product, categories, onClose, onSave }) {
  const isEdit = !!(product && product.id);
  const [form, setForm] = useState({
    id: product?.id || null,
    name: product?.name || '',
    category_id: product?.category_id || '',
    description: product?.description || '',
    price: product?.price || '',
    original_price: product?.original_price || '',
    image_url: product?.image_url || '',
    badge: product?.badge || '',
    badge_color: product?.badge_color || 'orange',
    sort_order: product?.sort_order || 0,
    is_active: product?.is_active !== undefined ? product.is_active : 1,
    features: (() => { try { const f = typeof product?.features === 'string' ? JSON.parse(product.features) : product?.features; return Array.isArray(f) ? f.join('\n') : ''; } catch { return ''; } })(),
    commands: (() => { try { const c = typeof product?.commands === 'string' ? JSON.parse(product.commands) : product?.commands; return Array.isArray(c) ? c.join('\n') : ''; } catch { return ''; } })(),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      price: parseInt(form.price) || 0,
      original_price: parseInt(form.original_price) || null,
      features: form.features.split('\n').filter(Boolean),
      commands: form.commands.split('\n').filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-2xl bg-dark-3 rounded-2xl border border-orange-500/20 my-4">
        <div className="flex items-center justify-between p-6 border-b border-orange-500/10">
          <h2 className="font-display text-xl font-bold text-white">
            {isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
          </h2>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-white" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-ui tracking-widest text-gray-400 mb-2">NAMA PRODUK *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="input-dark w-full px-4 py-2.5 rounded-xl font-body" placeholder="Rank VIP" required />
            </div>
            <div>
              <label className="block text-xs font-ui tracking-widest text-gray-400 mb-2">KATEGORI</label>
              <select value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}
                className="input-dark w-full px-4 py-2.5 rounded-xl font-body">
                <option value="">Pilih Kategori</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-ui tracking-widest text-gray-400 mb-2">HARGA (IDR) *</label>
              <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                className="input-dark w-full px-4 py-2.5 rounded-xl font-body" placeholder="50000" required />
            </div>
            <div>
              <label className="block text-xs font-ui tracking-widest text-gray-400 mb-2">HARGA ASLI (CORET)</label>
              <input type="number" value={form.original_price} onChange={e => setForm(p => ({ ...p, original_price: e.target.value }))}
                className="input-dark w-full px-4 py-2.5 rounded-xl font-body" placeholder="75000 (opsional)" />
            </div>
            <div>
              <label className="block text-xs font-ui tracking-widest text-gray-400 mb-2">BADGE TEXT</label>
              <input value={form.badge} onChange={e => setForm(p => ({ ...p, badge: e.target.value }))}
                className="input-dark w-full px-4 py-2.5 rounded-xl font-body" placeholder="BEST SELLER" />
            </div>
            <div>
              <label className="block text-xs font-ui tracking-widest text-gray-400 mb-2">BADGE WARNA</label>
              <select value={form.badge_color} onChange={e => setForm(p => ({ ...p, badge_color: e.target.value }))}
                className="input-dark w-full px-4 py-2.5 rounded-xl font-body">
                {['orange', 'red', 'purple', 'blue', 'green', 'yellow'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-ui tracking-widest text-gray-400 mb-2">URL GAMBAR</label>
              <input value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))}
                className="input-dark w-full px-4 py-2.5 rounded-xl font-body" placeholder="https://i.imgur.com/xxx.png" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-ui tracking-widest text-gray-400 mb-2">DESKRIPSI</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="input-dark w-full px-4 py-2.5 rounded-xl font-body resize-none h-20" placeholder="Deskripsi produk..." />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-ui tracking-widest text-gray-400 mb-2">
                FITUR (satu per baris)
              </label>
              <textarea value={form.features} onChange={e => setForm(p => ({ ...p, features: e.target.value }))}
                className="input-dark w-full px-4 py-2.5 rounded-xl font-body resize-none h-24"
                placeholder={"Akses ke area VIP\nKit VIP setiap hari\nPrefix [VIP] di chat"} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-ui tracking-widest text-gray-400 mb-2">
                COMMANDS MINECRAFT (satu per baris, gunakan {'{username}'} untuk nama player)
              </label>
              <textarea value={form.commands} onChange={e => setForm(p => ({ ...p, commands: e.target.value }))}
                className="input-dark w-full px-4 py-2.5 rounded-xl font-body resize-none h-24 font-mono text-sm"
                placeholder={"lp user {username} parent set vip\ngive {username} diamond 10\nbc {username} baru membeli Rank VIP!"} />
            </div>
            <div>
              <label className="block text-xs font-ui tracking-widest text-gray-400 mb-2">URUTAN TAMPIL</label>
              <input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
                className="input-dark w-full px-4 py-2.5 rounded-xl font-body" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" id="is_active" checked={form.is_active === 1 || form.is_active === true}
                onChange={e => setForm(p => ({ ...p, is_active: e.target.checked ? 1 : 0 }))}
                className="w-4 h-4 accent-orange-500" />
              <label htmlFor="is_active" className="font-ui text-sm text-gray-300 cursor-pointer">Produk Aktif</label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary rounded-xl px-6 py-2.5 flex-1">Batal</button>
            <button type="submit" className="btn-primary rounded-xl px-6 py-2.5 flex-1 flex items-center justify-center gap-2">
              <Save size={14} /> {isEdit ? 'Update Produk' : 'Tambah Produk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===================== CATEGORY MODAL =====================
function CategoryModal({ category, onClose, onSave }) {
  const isEdit = !!(category && category.id);
  const [form, setForm] = useState({
    id: category?.id || null,
    name: category?.name || '',
    icon: category?.icon || '📦',
    description: category?.description || '',
    sort_order: category?.sort_order || 0,
    is_active: category?.is_active !== undefined ? category.is_active : 1,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md bg-dark-3 rounded-2xl border border-orange-500/20">
        <div className="flex items-center justify-between p-6 border-b border-orange-500/10">
          <h2 className="font-display text-xl font-bold text-white">
            {isEdit ? 'Edit Kategori' : 'Tambah Kategori'}
          </h2>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-white" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-ui tracking-widest text-gray-400 mb-2">NAMA KATEGORI *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="input-dark w-full px-4 py-2.5 rounded-xl font-body" required />
          </div>
          <div>
            <label className="block text-xs font-ui tracking-widest text-gray-400 mb-2">ICON (emoji)</label>
            <input value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
              className="input-dark w-full px-4 py-2.5 rounded-xl font-body text-2xl" />
          </div>
          <div>
            <label className="block text-xs font-ui tracking-widest text-gray-400 mb-2">DESKRIPSI</label>
            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="input-dark w-full px-4 py-2.5 rounded-xl font-body" />
          </div>
          <div>
            <label className="block text-xs font-ui tracking-widest text-gray-400 mb-2">URUTAN</label>
            <input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
              className="input-dark w-full px-4 py-2.5 rounded-xl font-body" />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="cat_active" checked={form.is_active === 1 || form.is_active === true}
              onChange={e => setForm(p => ({ ...p, is_active: e.target.checked ? 1 : 0 }))}
              className="w-4 h-4 accent-orange-500" />
            <label htmlFor="cat_active" className="font-ui text-sm text-gray-300 cursor-pointer">Kategori Aktif</label>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary rounded-xl px-6 py-2.5 flex-1">Batal</button>
            <button type="submit" className="btn-primary rounded-xl px-6 py-2.5 flex-1 flex items-center justify-center gap-2">
              <Save size={14} /> Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
