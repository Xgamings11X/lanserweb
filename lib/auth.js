// lib/auth.js - Autentikasi Player via JPremium (database MySQL hosting)

import jwt     from 'jsonwebtoken';
import bcrypt  from 'bcryptjs';
import { query } from './db';   // satu db — pakai query biasa

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-GANTI-INI';

// ============================================================
// STRUKTUR TABEL JPREMIUM (plugin JPremium v2.x)
//
// Tabel utama yang dibuat JPremium di database MySQL:
//
//  jpremium_players
//    - uuid          VARCHAR(36)  ← UUID Mojang (premium) atau offline UUID
//    - name          VARCHAR(16)  ← username player (huruf asli)
//    - premium       TINYINT(1)   ← 1 = akun premium (beli Minecraft), 0 = cracked
//    - last_update   BIGINT
//
//  jpremium_accounts  (tabel password untuk non-premium / cracked)
//    - uuid          VARCHAR(36)  ← FK ke jpremium_players.uuid
//    - password      VARCHAR(256) ← bcrypt hash (JPremium pakai bcrypt)
//    - last_login    BIGINT
//    - ip            VARCHAR(45)
//
// Catatan:
//  - Player PREMIUM tidak perlu password di store
//    (akun mereka terverifikasi Mojang langsung lewat JPremium)
//  - Player CRACKED/NON-PREMIUM wajib input password
//    (password = yg mereka pakai /register di server)
// ============================================================

export async function verifyMinecraftPlayer(username, password) {
  try {
    // ── 1. Cari player di tabel jpremium_players ──────────
    const playerRows = await query(
      `SELECT * FROM jpremium_players
       WHERE LOWER(name) = LOWER(?)
       LIMIT 1`,
      [username]
    );

    if (playerRows.length === 0) {
      return {
        success: false,
        message: 'Username tidak ditemukan. Pastikan kamu sudah pernah join ke server.',
      };
    }

    const player = playerRows[0];
    const isPremium = player.premium === 1 || player.premium === true;

    // ── 2. Handling player PREMIUM ────────────────────────
    // Player premium terverifikasi Mojang — tidak perlu cek password
    // Kita tetap minta password sebagai konfirmasi keamanan tambahan
    // (opsional, bisa hapus blok ini jika ingin premium langsung masuk)
    if (isPremium) {
      // Untuk premium: cek apakah ada password di jpremium_accounts
      // Jika tidak ada → langsung lolos (murni premium)
      const accRows = await query(
        `SELECT * FROM jpremium_accounts WHERE uuid = ? LIMIT 1`,
        [player.uuid]
      );

      if (accRows.length === 0) {
        // Premium murni tanpa password store → langsung izinkan
        return {
          success: true,
          player: {
            username: player.name,
            uuid:      player.uuid,
            isPremium: true,
          },
        };
      }

      // Premium tapi punya password → verifikasi
      const acc = accRows[0];
      const valid = await verifyJPremiumPassword(password, acc.password);
      if (!valid) {
        return { success: false, message: 'Password salah.' };
      }

      return {
        success: true,
        player: { username: player.name, uuid: player.uuid, isPremium: true },
      };
    }

    // ── 3. Handling player CRACKED / NON-PREMIUM ─────────
    // Wajib punya password di jpremium_accounts
    const accRows = await query(
      `SELECT * FROM jpremium_accounts WHERE uuid = ? LIMIT 1`,
      [player.uuid]
    );

    if (accRows.length === 0) {
      return {
        success: false,
        message: 'Akun belum terdaftar. Lakukan /register di server terlebih dahulu.',
      };
    }

    const acc = accRows[0];
    const valid = await verifyJPremiumPassword(password, acc.password);

    if (!valid) {
      return { success: false, message: 'Password salah.' };
    }

    return {
      success: true,
      player: {
        username:  player.name,
        uuid:      player.uuid,
        isPremium: false,
      },
    };

  } catch (error) {
    console.error('JPremium auth error:', error);

    // Pesan ramah jika tabel tidak ditemukan
    if (error.message?.includes("doesn't exist") || error.code === 'ER_NO_SUCH_TABLE') {
      return {
        success: false,
        message:
          'Tabel JPremium tidak ditemukan. Pastikan nama database di .env sudah benar ' +
          'dan plugin JPremium sudah pernah dijalankan di server.',
      };
    }

    return { success: false, message: 'Terjadi kesalahan server: ' + error.message };
  }
}

// ============================================================
// VERIFIKASI PASSWORD JPREMIUM
// JPremium menggunakan BCrypt untuk semua password player
// ============================================================
async function verifyJPremiumPassword(inputPassword, storedHash) {
  if (!storedHash || !inputPassword) return false;

  // BCrypt (format $2a$ atau $2b$) — format utama JPremium
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    return await bcrypt.compare(inputPassword, storedHash);
  }

  // Fallback: SHA-256 polos (beberapa konfigurasi lama)
  const crypto = await import('crypto');
  const sha256 = crypto.createHash('sha256').update(inputPassword).digest('hex');
  if (sha256 === storedHash) return true;

  // Fallback: SHA-256 dengan salt format $SHA$salt$hash (AuthMe-style, kalau migrasi)
  if (storedHash.startsWith('$SHA$')) {
    const parts = storedHash.split('$'); // ['', 'SHA', salt, hash]
    if (parts.length >= 4) {
      const salt = parts[2];
      const hash = parts[3];
      const computed = crypto
        .createHash('sha256')
        .update(sha256 + salt)
        .digest('hex');
      return computed === hash;
    }
  }

  return false;
}

// ============================================================
// JWT — Player
// ============================================================
export function generatePlayerToken(player) {
  return jwt.sign(
    {
      username:  player.username,
      uuid:      player.uuid,
      isPremium: player.isPremium,
      type:      'player',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ============================================================
// JWT — Admin
// ============================================================
export function generateAdminToken(admin) {
  return jwt.sign(
    { id: admin.id, username: admin.username, type: 'admin' },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Middleware helper untuk API route
export function withAuth(handler, options = {}) {
  return async (req, res) => {
    const token =
      req.cookies?.token ||
      req.headers?.authorization?.replace('Bearer ', '');

    if (!token) return res.status(401).json({ error: 'Tidak terautentikasi' });

    const decoded = verifyToken(token);
    if (!decoded)   return res.status(401).json({ error: 'Token tidak valid atau expired' });

    if (options.adminOnly && decoded.type !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak — bukan admin' });
    }

    req.user = decoded;
    return handler(req, res);
  };
}

// ============================================================
// ADMIN AUTHENTICATION
// ============================================================
export async function verifyAdmin(username, password) {
  // Cek di tabel store_admins dulu
  const admins = await query(
    `SELECT * FROM store_admins WHERE username = ? LIMIT 1`,
    [username]
  );

  if (admins.length > 0) {
    const admin = admins[0];
    const valid = await bcrypt.compare(password, admin.password);
    if (valid) return { success: true, admin: { id: admin.id, username: admin.username } };
  }

  // Fallback ke env variable (untuk pertama kali setup)
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return { success: true, admin: { id: 0, username } };
  }

  return { success: false, message: 'Username atau password admin salah' };
}
