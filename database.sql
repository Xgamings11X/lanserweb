-- ================================================================
-- MINECRAFT STORE — DATABASE SCHEMA
-- Import file ini di phpMyAdmin hosting kamu
--
-- PENTING:
--   Tabel di bawah (store_*) adalah tabel WEBSITE STORE.
--   Tabel JPremium (jpremium_players, jpremium_accounts) dibuat
--   OTOMATIS oleh plugin JPremium saat server Minecraft dijalankan.
--   Pastikan plugin JPremium sudah pernah dijalankan sebelum
--   website ini digunakan, agar tabel JPremium sudah tersedia.
-- ================================================================

-- Gunakan database yang sama dengan JPremium
-- (sesuaikan nama database di .env.local)

-- ================================================================
-- TABEL SETTINGS WEBSITE
-- ================================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  setting_key   VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABEL KATEGORI PRODUK STORE
-- ================================================================
CREATE TABLE IF NOT EXISTS store_categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  icon        VARCHAR(50)  DEFAULT '⚔️',
  description TEXT,
  sort_order  INT          DEFAULT 0,
  is_active   TINYINT(1)   DEFAULT 1,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABEL PRODUK STORE
-- ================================================================
CREATE TABLE IF NOT EXISTS store_products (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  category_id    INT,
  name           VARCHAR(200) NOT NULL,
  slug           VARCHAR(200) UNIQUE NOT NULL,
  description    TEXT,
  features       JSON COMMENT 'Array fitur produk',
  price          INT          NOT NULL DEFAULT 0 COMMENT 'Harga dalam Rupiah',
  original_price INT          DEFAULT NULL COMMENT 'Harga coret (opsional)',
  image_url      VARCHAR(500),
  badge          VARCHAR(50)  COMMENT 'Contoh: BEST SELLER, HOT, NEW',
  badge_color    VARCHAR(20)  DEFAULT 'orange',
  commands       JSON         COMMENT 'Minecraft commands, gunakan {username} untuk nama player',
  sort_order     INT          DEFAULT 0,
  is_active      TINYINT(1)   DEFAULT 1,
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES store_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABEL ORDERS / TRANSAKSI
-- ================================================================
CREATE TABLE IF NOT EXISTS store_orders (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  order_id                VARCHAR(100) UNIQUE NOT NULL,
  player_username         VARCHAR(100) NOT NULL,
  player_uuid             VARCHAR(100),
  product_id              INT          NOT NULL,
  product_name            VARCHAR(200),
  amount                  INT          NOT NULL COMMENT 'Harga dalam Rupiah',
  payment_method          VARCHAR(50)  DEFAULT 'qris',
  payment_status          ENUM('pending','paid','failed','expired','cancelled') DEFAULT 'pending',
  midtrans_transaction_id VARCHAR(200),
  midtrans_snap_token     TEXT,
  commands_executed       TINYINT(1)   DEFAULT 0,
  notes                   TEXT,
  created_at              TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_player   (player_username),
  INDEX idx_status   (payment_status),
  INDEX idx_order_id (order_id),
  FOREIGN KEY (product_id) REFERENCES store_products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TABEL ADMIN PANEL
-- ================================================================
CREATE TABLE IF NOT EXISTS store_admins (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(100) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL COMMENT 'bcrypt hash',
  email      VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- DATA DEFAULT — SETTINGS
-- ================================================================
INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES
('server_name',        'NusaCraft'),
('server_ip',          'play.nusacraft.net'),
('server_description', 'Economy Semi RPG Server terbaik di Indonesia!'),
('discord_url',        'https://discord.gg/yourserver'),
('vote_url',           'https://minecraft-server-list.com'),
('hero_title',         'Selamat Datang di NusaCraft'),
('hero_subtitle',      'Economy Semi RPG Server – Beli rank, senjata & item eksklusif!'),
('announcement',       '🎉 Grand Opening! Diskon 20% semua item minggu ini!'),
('logo_text',          'NusaCraft'),
('footer_text',        '© 2024 NusaCraft. All rights reserved.'),
('players_online',     '0'),
('server_status',      'online');

-- ================================================================
-- DATA DEFAULT — KATEGORI
-- ================================================================
INSERT IGNORE INTO store_categories (name, slug, icon, description, sort_order) VALUES
('Rank',       'rank',       '👑', 'Tingkatkan status di server dengan rank eksklusif',  1),
('Weapon',     'weapon',     '⚔️', 'Senjata powerful dengan enchantment terbaik',         2),
('SellWand',   'sellwand',   '🪄', 'Tongkat ajaib untuk menjual item dengan mudah',       3),
('AuraSkills', 'auraskills', '✨', 'Boost skill aura kamu untuk dominasi server',          4),
('Crate Key',  'crate-key',  '🗝️', 'Kunci untuk membuka crate berisi hadiah langka',     5),
('Kit',        'kit',        '🎒', 'Paket starter kit lengkap untuk petualanganmu',        6);

-- ================================================================
-- DATA DEFAULT — PRODUK CONTOH
-- Ganti/hapus sesuai produk server kamu lewat Admin Panel
-- ================================================================
INSERT IGNORE INTO store_products
  (name, slug, category_id, description, price, original_price, badge, badge_color, features, commands, sort_order)
VALUES
(
  'Rank VIP', 'rank-vip',
  (SELECT id FROM store_categories WHERE slug='rank' LIMIT 1),
  'Rank VIP memberikan akses ke berbagai fitur eksklusif di server.',
  25000, 35000, 'POPULER', 'orange',
  '["Prefix §6[VIP]§r di chat","Kit VIP setiap hari","Akses /fly di spawn","Set 5 home","Slot auction x3"]',
  '["lp user {username} parent set vip","give {username} diamond 5","broadcast §6{username} §fbaru saja bergabung sebagai §6[VIP]§f!"]',
  1
),
(
  'Rank MVP', 'rank-mvp',
  (SELECT id FROM store_categories WHERE slug='rank' LIMIT 1),
  'Rank MVP adalah rank tertinggi dengan semua keistimewaan VIP plus bonus eksklusif.',
  50000, 75000, 'BEST VALUE', 'purple',
  '["Prefix §c[MVP]§r di chat","Semua benefit VIP","Fly di semua area","Set 15 home","Priority queue login","Custom join message"]',
  '["lp user {username} parent set mvp","give {username} netherite_ingot 3","broadcast §c{username} §fbaru saja bergabung sebagai §c[MVP]§f!"]',
  2
),
(
  'God Sword', 'god-sword',
  (SELECT id FROM store_categories WHERE slug='weapon' LIMIT 1),
  'Pedang dengan enchant maksimal, siap tempur sejak hari pertama!',
  15000, NULL, 'KUAT', 'red',
  '["Sharpness V","Unbreaking III","Looting III","Sweeping Edge III","Mending"]',
  '["give {username} minecraft:diamond_sword{display:{Name:''[{\"text\":\"§6God Sword\"}]''},Enchantments:[{id:\"minecraft:sharpness\",lvl:5},{id:\"minecraft:unbreaking\",lvl:3},{id:\"minecraft:looting\",lvl:3},{id:\"minecraft:mending\",lvl:1}]} 1"]',
  1
),
(
  'SellWand 500 Uses', 'sellwand-500',
  (SELECT id FROM store_categories WHERE slug='sellwand' LIMIT 1),
  'Tongkat jual otomatis 500 kali pakai. Klik chest untuk langsung menjual semua isi!',
  20000, NULL, 'HEMAT', 'green',
  '["500x penggunaan","Jual seluruh isi chest sekaligus","Compatible semua chest shop","Tidak perlu buka GUI"]',
  '["sellwand give {username} 500"]',
  1
),
(
  'AuraSkills XP Boost', 'auraskills-xp-boost',
  (SELECT id FROM store_categories WHERE slug='auraskills' LIMIT 1),
  'Dapatkan 50.000 XP untuk skill pilihan kamu di AuraSkills!',
  30000, NULL, 'SPESIAL', 'blue',
  '["50.000 XP AuraSkills","Pilih skill sesukamu","Percepat leveling karakter","Berlaku permanen"]',
  '["auraskills xp add {username} fighting 50000","auraskills xp add {username} agility 50000"]',
  1
),
(
  'Legendary Key x5', 'legendary-key-x5',
  (SELECT id FROM store_categories WHERE slug='crate-key' LIMIT 1),
  'Paket 5 kunci Legendary Crate. Buka dan raih item-item langka!',
  35000, 50000, 'HEMAT', 'yellow',
  '["5x Legendary Crate Key","Hadiah: Rank, Diamond, Netherite & lebih","Chance item custom rare","Gunakan kapan saja"]',
  '["crates key give {username} legendary 5","broadcast §d{username} §fmembeli §65x Legendary Key§f!"]',
  1
);

-- ================================================================
-- REFERENSI TABEL JPREMIUM (dibuat otomatis oleh plugin)
-- Ini hanya catatan — JANGAN dijalankan, sudah ada dari plugin
-- ================================================================
-- jpremium_players:
--   uuid      VARCHAR(36) PK
--   name      VARCHAR(16)
--   premium   TINYINT(1)   ← 1=premium Mojang, 0=cracked
--   last_update BIGINT
--
-- jpremium_accounts:
--   uuid      VARCHAR(36) FK → jpremium_players.uuid
--   password  VARCHAR(256)  ← BCrypt hash dari /register
--   last_login BIGINT
--   ip        VARCHAR(45)
-- ================================================================
