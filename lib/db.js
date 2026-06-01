// lib/db.js - Koneksi Database MySQL (SATU DATABASE di hosting)
// Semua data store & data Minecraft player ada di database yang sama

import mysql from 'mysql2/promise';

// ============================================================
// SATU POOL UNTUK SEMUA KEBUTUHAN
// Database hosting kamu (cPanel/Niagahoster/Domainesia/dll)
// ============================================================
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'minecraft_store',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            'utf8mb4',
  // Beberapa hosting shared perlu ini agar koneksi tidak timeout
  enableKeepAlive:    true,
  keepAliveInitialDelay: 0,
});

// Query helper utama (store tables)
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// Alias untuk query JPremium/player — tetap pakai pool yang sama
// karena semua ada di satu database hosting
export async function mcQuery(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// ============================================================
// INISIALISASI TABEL STORE
// Tabel JPremium sudah dibuat otomatis oleh plugin,
// kita hanya membuat tabel kebutuhan store di sini
// ============================================================
export async function initDatabase() {
  // Tabel settings website
  await query(`CREATE TABLE IF NOT EXISTS site_settings (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    setting_key   VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  // Tabel kategori produk
  await query(`CREATE TABLE IF NOT EXISTS store_categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) UNIQUE NOT NULL,
    icon        VARCHAR(50)  DEFAULT '⚔️',
    description TEXT,
    sort_order  INT          DEFAULT 0,
    is_active   TINYINT(1)   DEFAULT 1,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  // Tabel produk
  await query(`CREATE TABLE IF NOT EXISTS store_products (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    category_id    INT,
    name           VARCHAR(200) NOT NULL,
    slug           VARCHAR(200) UNIQUE NOT NULL,
    description    TEXT,
    features       JSON,
    price          INT         NOT NULL DEFAULT 0,
    original_price INT         DEFAULT NULL,
    image_url      VARCHAR(500),
    badge          VARCHAR(50),
    badge_color    VARCHAR(20)  DEFAULT 'orange',
    commands       JSON COMMENT 'MC commands, gunakan {username}',
    sort_order     INT          DEFAULT 0,
    is_active      TINYINT(1)   DEFAULT 1,
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES store_categories(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  // Tabel orders / transaksi
  await query(`CREATE TABLE IF NOT EXISTS store_orders (
    id                     INT AUTO_INCREMENT PRIMARY KEY,
    order_id               VARCHAR(100) UNIQUE NOT NULL,
    player_username        VARCHAR(100) NOT NULL,
    player_uuid            VARCHAR(100),
    product_id             INT          NOT NULL,
    product_name           VARCHAR(200),
    amount                 INT          NOT NULL,
    payment_method         VARCHAR(50)  DEFAULT 'qris',
    payment_status         ENUM('pending','paid','failed','expired','cancelled') DEFAULT 'pending',
    midtrans_transaction_id VARCHAR(200),
    midtrans_snap_token    TEXT,
    commands_executed      TINYINT(1)   DEFAULT 0,
    notes                  TEXT,
    created_at             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_player   (player_username),
    INDEX idx_status   (payment_status),
    INDEX idx_order_id (order_id),
    FOREIGN KEY (product_id) REFERENCES store_products(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  // Tabel admin panel
  await query(`CREATE TABLE IF NOT EXISTS store_admins (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(100) UNIQUE NOT NULL,
    password   VARCHAR(255) NOT NULL COMMENT 'bcrypt hash',
    email      VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  // ── Default settings ─────────────────────────────────────
  const defaults = [
    ['server_name',        'NusaCraft'],
    ['server_ip',          'play.nusacraft.net'],
    ['server_description', 'Economy Semi RPG Server terbaik di Indonesia!'],
    ['discord_url',        'https://discord.gg/yourserver'],
    ['vote_url',           'https://minecraft-server-list.com'],
    ['hero_title',         'Selamat Datang di NusaCraft'],
    ['hero_subtitle',      'Economy Semi RPG Server – Beli rank, senjata & item eksklusif!'],
    ['announcement',       '🎉 Grand Opening! Diskon 20% semua item minggu ini!'],
    ['logo_text',          'NusaCraft'],
    ['footer_text',        '© 2024 NusaCraft. All rights reserved.'],
    ['players_online',     '0'],
    ['server_status',      'online'],
  ];
  for (const [k, v] of defaults) {
    await query(
      `INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES (?, ?)`,
      [k, v]
    );
  }

  // ── Default kategori ─────────────────────────────────────
  const cats = [
    ['Rank',       'rank',       '👑', 'Tingkatkan status di server dengan rank eksklusif', 1],
    ['Weapon',     'weapon',     '⚔️', 'Senjata powerful dengan enchantment terbaik',        2],
    ['SellWand',   'sellwand',   '🪄', 'Tongkat ajaib untuk menjual item dengan mudah',      3],
    ['AuraSkills', 'auraskills', '✨', 'Boost skill aura kamu untuk dominasi server',         4],
    ['Crate Key',  'crate-key',  '🗝️', 'Kunci untuk membuka crate berisi hadiah langka',    5],
    ['Kit',        'kit',        '🎒', 'Paket starter kit lengkap untuk petualanganmu',       6],
  ];
  for (const [name, slug, icon, desc, ord] of cats) {
    await query(
      `INSERT IGNORE INTO store_categories (name, slug, icon, description, sort_order) VALUES (?, ?, ?, ?, ?)`,
      [name, slug, icon, desc, ord]
    );
  }

  console.log('✅ Store database initialized');
}

export default pool;
