// pages/index.js - Landing Page Utama
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { getSettings } from '../lib/settings';

export async function getServerSideProps() {
  try {
    const settings = await getSettings();
    return { props: { settings } };
  } catch {
    return { props: { settings: {} } };
  }
}

export default function HomePage({ settings }) {
  const s = {
    serverName: settings.server_name || 'NusaCraft',
    serverIp: settings.server_ip || 'play.nusacraft.net',
    description: settings.server_description || 'Economy Semi RPG Server terbaik!',
    discordUrl: settings.discord_url || '#',
    voteUrl: settings.vote_url || '#',
    heroTitle: settings.hero_title || 'Selamat Datang di NusaCraft',
    heroSubtitle: settings.hero_subtitle || 'Economy Semi RPG Server',
    announcement: settings.announcement || '',
    logoText: settings.logo_text || 'NusaCraft',
    playersOnline: settings.players_online || '0',
    serverStatus: settings.server_status || 'online',
  };

  const [copied, setCopied] = useState(false);
  const [particles, setParticles] = useState([]);
  const particlesRef = useRef([]);

  useEffect(() => {
    // Generate particles
    const p = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 6 + Math.random() * 8,
      size: 1 + Math.random() * 3,
    }));
    setParticles(p);
  }, []);

  const copyIP = () => {
    navigator.clipboard.writeText(s.serverIp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Head>
        <title>{s.serverName} - Store</title>
        <meta name="description" content={s.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Grid overlay */}
      <div className="grid-overlay" />

      {/* Particles */}
      <div className="particles-bg">
        {particles.map(p => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              background: p.id % 3 === 0 ? '#f59e0b' : '#f97316',
            }}
          />
        ))}
      </div>

      {/* Announcement Bar */}
      {s.announcement && (
        <div className="announcement-bar relative z-50 py-2 px-4 text-center text-black font-ui font-bold text-sm tracking-widest">
          {s.announcement}
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">

          {/* Logo / Server Name */}
          <div className="mb-8 animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="diamond-deco w-3 h-3" />
              <span className="font-ui text-orange-400 tracking-[0.4em] text-sm uppercase">
                Economy Semi RPG Server
              </span>
              <div className="diamond-deco w-3 h-3" />
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-black glow-text"
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 50%, #fb923c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
              {s.logoText}
            </h1>
          </div>

          {/* Server IP */}
          <div className="mb-10 animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <div className="flex items-center gap-3 bg-dark-3 border border-orange-500/20 rounded-xl px-6 py-3 cursor-pointer hover:border-orange-500/50 transition-all group"
              onClick={copyIP}>
              <div className={`w-2 h-2 rounded-full ${s.serverStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="font-ui text-lg tracking-wider text-orange-300">{s.serverIp}</span>
              <span className="text-xs text-dark-5 group-hover:text-orange-400 transition-colors font-ui">
                {copied ? '✓ COPIED!' : 'KLIK COPY'}
              </span>
            </div>
            <p className="text-sm text-dark-5 mt-2 font-ui">
              {s.serverStatus === 'online' ? `🟢 ${s.playersOnline} Player Online` : '🔴 Server Offline'}
            </p>
          </div>

          {/* Description */}
          <p className="max-w-xl text-gray-400 font-body text-lg leading-relaxed mb-16 animate-fade-up"
            style={{ animationDelay: '0.3s', opacity: 0 }}>
            {s.description}
          </p>

          {/* === 3 MAIN BUTTONS === */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl animate-fade-up"
            style={{ animationDelay: '0.4s', opacity: 0 }}>

            {/* VOTE */}
            <a href={s.voteUrl} target="_blank" rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-2xl border-glow p-8 bg-dark-3 card-hover cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-5xl mb-4 filter drop-shadow-lg">🗳️</div>
              <h2 className="font-display text-2xl font-bold text-amber-400 mb-2">Vote</h2>
              <p className="text-gray-500 font-body text-sm leading-relaxed">
                Vote untuk server dan dapatkan reward spesial setiap hari!
              </p>
              <div className="mt-4 flex items-center text-amber-400/60 font-ui text-xs tracking-widest group-hover:text-amber-400 transition-colors">
                VOTE SEKARANG →
              </div>
            </a>

            {/* STORE */}
            <Link href="/store"
              className="group relative overflow-hidden rounded-2xl p-8 card-hover cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.08) 100%)',
                border: '1px solid rgba(249,115,22,0.4)',
                boxShadow: '0 0 30px rgba(249,115,22,0.1)',
              }}>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-3 right-3 text-xs font-ui font-bold tracking-widest px-2 py-1 rounded badge-orange">
                HOT
              </div>
              <div className="text-5xl mb-4 filter drop-shadow-lg">🏪</div>
              <h2 className="font-display text-2xl font-bold mb-2"
                style={{ color: '#f97316', textShadow: '0 0 20px rgba(249,115,22,0.4)' }}>
                Store
              </h2>
              <p className="text-gray-400 font-body text-sm leading-relaxed">
                Beli rank, senjata, sellwand, dan item eksklusif lainnya!
              </p>
              <div className="mt-4 flex items-center text-orange-400/60 font-ui text-xs tracking-widest group-hover:text-orange-400 transition-colors">
                BUKA STORE →
              </div>
            </Link>

            {/* DISCORD */}
            <a href={s.discordUrl} target="_blank" rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-2xl border-glow p-8 bg-dark-3 card-hover cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-5xl mb-4 filter drop-shadow-lg">💬</div>
              <h2 className="font-display text-2xl font-bold text-indigo-400 mb-2">Discord</h2>
              <p className="text-gray-500 font-body text-sm leading-relaxed">
                Bergabung ke komunitas kami dan dapatkan info terbaru!
              </p>
              <div className="mt-4 flex items-center text-indigo-400/60 font-ui text-xs tracking-widest group-hover:text-indigo-400 transition-colors">
                JOIN DISCORD →
              </div>
            </a>
          </div>

          {/* Features Strip */}
          <div className="mt-20 flex flex-wrap justify-center gap-8 animate-fade-up"
            style={{ animationDelay: '0.5s', opacity: 0 }}>
            {[
              { icon: '⚔️', label: 'AuraSkills RPG' },
              { icon: '💰', label: 'Economy System' },
              { icon: '🏰', label: 'Land Claim' },
              { icon: '👑', label: 'Custom Rank' },
              { icon: '🪄', label: 'SellWand' },
              { icon: '🎁', label: 'Crate System' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-500 hover:text-orange-400 transition-colors">
                <span>{f.icon}</span>
                <span className="font-ui text-sm tracking-wider">{f.label}</span>
              </div>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-orange-500/10 py-6 px-4 text-center">
          <p className="text-dark-5 font-body text-sm">
            {settings.footer_text || `© 2024 ${s.serverName}. All rights reserved.`}
          </p>
          <p className="text-dark-5 font-ui text-xs mt-1 tracking-widest">
            NOT AFFILIATED WITH MOJANG OR MICROSOFT
          </p>
        </footer>
      </div>
    </>
  );
}
