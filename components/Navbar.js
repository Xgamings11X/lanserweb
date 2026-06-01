// components/Navbar.js
import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, ShoppingBag, User, LogOut, ChevronDown } from 'lucide-react';

export default function Navbar({ settings, player, onLogout, onLoginClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const s = settings || {};

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-dark/80 backdrop-blur-lg border-b border-orange-500/10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="diamond-deco group-hover:shadow-orange-500/80 transition-all" style={{ width: 10, height: 10 }} />
          <span className="font-display text-xl font-bold"
            style={{ color: '#f97316', textShadow: '0 0 15px rgba(249,115,22,0.4)' }}>
            {s.logo_text || 'NusaCraft'}
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="font-ui text-sm tracking-wider text-gray-400 hover:text-orange-400 transition-colors">
            BERANDA
          </Link>
          <Link href="/store" className="font-ui text-sm tracking-wider text-gray-400 hover:text-orange-400 transition-colors">
            STORE
          </Link>
          <a href={s.vote_url || '#'} target="_blank" rel="noopener noreferrer"
            className="font-ui text-sm tracking-wider text-gray-400 hover:text-amber-400 transition-colors">
            VOTE
          </a>
          <a href={s.discord_url || '#'} target="_blank" rel="noopener noreferrer"
            className="font-ui text-sm tracking-wider text-gray-400 hover:text-indigo-400 transition-colors">
            DISCORD
          </a>
        </div>

        {/* Auth Button */}
        <div className="hidden md:flex items-center gap-3">
          {player ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-dark-3 border border-green-500/20 rounded-lg px-3 py-2">
                <img
                  src={`https://crafatar.com/avatars/${player.uuid || player.username}?size=20&overlay`}
                  alt={player.username}
                  className="w-5 h-5 rounded"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span className="font-ui text-sm text-green-400">{player.username}</span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1 btn-secondary rounded-lg px-3 py-2 text-xs">
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="btn-primary rounded-lg px-5 py-2 text-sm flex items-center gap-2">
              <User size={15} />
              Login
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-gray-400 hover:text-orange-400 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-dark-2 border-t border-orange-500/10 px-4 py-4 flex flex-col gap-4">
          <Link href="/" className="font-ui text-sm tracking-wider text-gray-400 hover:text-orange-400" onClick={() => setMenuOpen(false)}>BERANDA</Link>
          <Link href="/store" className="font-ui text-sm tracking-wider text-gray-400 hover:text-orange-400" onClick={() => setMenuOpen(false)}>STORE</Link>
          <a href={s.vote_url || '#'} className="font-ui text-sm tracking-wider text-gray-400 hover:text-amber-400" onClick={() => setMenuOpen(false)}>VOTE</a>
          <a href={s.discord_url || '#'} className="font-ui text-sm tracking-wider text-gray-400 hover:text-indigo-400" onClick={() => setMenuOpen(false)}>DISCORD</a>
          {player ? (
            <button onClick={() => { onLogout(); setMenuOpen(false); }}
              className="btn-secondary rounded-lg px-4 py-2 text-sm text-left">
              Logout ({player.username})
            </button>
          ) : (
            <button onClick={() => { onLoginClick(); setMenuOpen(false); }}
              className="btn-primary rounded-lg px-4 py-2 text-sm">
              Login dengan Akun Minecraft
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
