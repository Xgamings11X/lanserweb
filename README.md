# ⚔️ NusaCraft Store — Minecraft Economy RPG Store

Website store lengkap untuk Minecraft server dengan sistem QRIS, autentikasi JPremium, dan admin panel.

---

## 🌟 FITUR

- **Landing Page** dengan Vote, Store, Discord
- **Store Page** dengan kategori Rank, Weapon, SellWand, AuraSkills, Crate Key, Kit
- **Login Player** — terhubung langsung ke database Minecraft (JPremium + AuthMe)
- **Pembayaran QRIS** via Midtrans (GoPay, OVO, Bank Transfer, QRIS)
- **Auto-deliver** — command Minecraft otomatis dieksekusi via RCON setelah bayar
- **Admin Panel** lengkap — tambah/edit/hapus produk, kategori, lihat orders, ubah settings
- **Deploy Vercel** atau **Webhosting biasa** (VPS/cPanel)
- Desain **orange dark theme** bergaya RPG

---

## 📁 STRUKTUR PROJECT

```
minecraft-store/
├── pages/
│   ├── index.js          ← Landing page (Vote/Store/Discord)
│   ├── store.js          ← Halaman toko
│   ├── admin/index.js    ← Admin dashboard
│   ├── _app.js
│   ├── _document.js
│   └── api/
│       ├── init.js                     ← Inisialisasi DB
│       ├── auth/login.js               ← Login player
│       ├── auth/admin-login.js         ← Login admin
│       ├── orders/create.js            ← Buat order + Midtrans
│       ├── orders/webhook.js           ← Notifikasi Midtrans
│       ├── orders/verify/[orderId].js  ← Cek status order
│       └── admin/
│           ├── products.js   ← CRUD produk
│           ├── categories.js ← CRUD kategori
│           ├── orders.js     ← Lihat & kelola orders
│           └── settings.js   ← Edit settings website
├── components/
│   ├── Navbar.js
│   ├── ProductCard.js
│   ├── LoginModal.js   ← Login dengan akun Minecraft
│   └── CartModal.js    ← Checkout + QRIS
├── lib/
│   ├── db.js           ← Koneksi MySQL (store & Minecraft)
│   ├── auth.js         ← JWT + JPremium/AuthMe verification
│   ├── midtrans.js     ← Midtrans QRIS payment
│   ├── rcon.js         ← Kirim command ke Minecraft via RCON
│   └── settings.js
├── styles/globals.css
├── database.sql        ← Schema + data awal
├── .env.example        ← Template environment variables
├── vercel.json
└── package.json
```

---

## 🚀 CARA INSTALL

### OPSI 1 — Deploy ke Vercel (Gratis, Mudah)

> **Cocok untuk:** server dengan database yang bisa diakses dari internet (VPS, RDS, PlanetScale, dll)

#### 1. Persiapan Database

Database harus bisa diakses dari luar (tidak localhost). Opsi:
- **VPS** dengan MySQL port 3306 terbuka
- **PlanetScale** (MySQL gratis): https://planetscale.com
- **Railway** (MySQL gratis): https://railway.app
- **Aiven** (MySQL gratis): https://aiven.io

Import schema:
```sql
-- Di phpMyAdmin atau MySQL CLI:
source database.sql;
```

#### 2. Upload ke GitHub

```bash
cd minecraft-store
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/minecraft-store.git
git push -u origin main
```

#### 3. Deploy di Vercel

1. Buka https://vercel.com → New Project
2. Import repository GitHub kamu
3. Di bagian **Environment Variables**, tambahkan semua variabel dari `.env.example`:

```
DB_HOST          = your-db-host.com
DB_PORT          = 3306
DB_USER          = your_user
DB_PASSWORD      = your_password
DB_NAME          = minecraft_store

# Tidak diperlukan lagi — semua dalam 1 database
MC_DB_USER       = mc_user
MC_DB_PASSWORD   = mc_password
MC_DB_NAME       = minecraft_db

JWT_SECRET       = random-string-panjang-minimal-32-karakter
MIDTRANS_SERVER_KEY = SB-Mid-server-xxxx
MIDTRANS_CLIENT_KEY = SB-Mid-client-xxxx
MIDTRANS_ENV     = sandbox  (ganti production saat live)

NEXT_PUBLIC_BASE_URL = https://nama-project.vercel.app

RCON_HOST        = ip.server.minecraft.kamu
RCON_PORT        = 25575
RCON_PASSWORD    = rcon_password

ADMIN_USERNAME   = admin
ADMIN_PASSWORD   = password_admin_kamu
```

4. Klik **Deploy** → tunggu build selesai
5. Inisialisasi database: buka `https://domain.vercel.app/api/init?secret=JWT_SECRET_KAMU`

#### 4. Setting Midtrans Webhook

Di [Midtrans Dashboard](https://dashboard.midtrans.com):
- Settings → Configuration
- **Payment Notification URL**: `https://domain.vercel.app/api/orders/webhook`

---

### OPSI 2 — VPS / Webhosting Sendiri

> **Cocok untuk:** VPS Ubuntu/Debian, atau server yang support Node.js

#### Requirements
- Node.js 18+
- MySQL 5.7+ atau MariaDB 10+
- PM2 (process manager)

#### 1. Install di VPS

```bash
# Clone atau upload project
cd /var/www
git clone https://github.com/username/minecraft-store.git
cd minecraft-store

# Install dependencies
npm install

# Copy dan edit environment
cp .env.example .env.local
nano .env.local
# → isi semua variabel, DB_HOST=localhost karena satu server

# Import database
mysql -u root -p < database.sql

# Build project
npm run build

# Jalankan dengan PM2
npm install -g pm2
pm2 start npm --name "minecraft-store" -- start
pm2 startup
pm2 save
```

#### 2. Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name store.servermu.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# SSL dengan Certbot
sudo certbot --nginx -d store.servermu.com
```

#### 3. Inisialisasi Database

Buka: `https://store.servermu.com/api/init?secret=JWT_SECRET_KAMU`

---

### OPSI 3 — cPanel Shared Hosting (dengan Node.js App)

> Hanya jika hosting support Node.js (Niagahoster Business, Hostinger Business, dll)

1. Upload semua file via File Manager
2. Di cPanel → **Setup Node.js App**
3. Node.js version: **18.x**
4. Application root: `/minecraft-store`
5. Application startup file: `server.js` (buat file ini):

```js
// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  }).listen(process.env.PORT || 3000);
});
```

6. Install dependencies dan build di SSH:
```bash
npm install
npm run build
```

---

## ⚙️ KONFIGURASI MINECRAFT SERVER

### 1. Aktifkan RCON di server.properties

```properties
enable-rcon=true
rcon.port=25575
rcon.password=password_rcon_kamu
```

### 2. Firewall — buka port RCON hanya untuk IP website

```bash
# Jika VPS pakai UFW:
ufw allow from IP_WEBSITE to any port 25575

# Jika pakai iptables:
iptables -A INPUT -p tcp --dport 25575 -s IP_WEBSITE -j ACCEPT
```

### 3. JPremium Setup

File `plugins/JPremium/config.yml`:
```yaml
database:
  enabled: true
  host: localhost
  port: 3306
  database: minecraft_db
  username: mc_user
  password: mc_password
```

Pastikan `.env.local` website:
```
# Tidak diperlukan lagi — semua dalam 1 database
MC_DB_NAME=minecraft_db  ← nama database JPremium
AUTH_TABLE=authme        ← nama tabel password (authme/nlogin)
JPREMIUM_TABLE=jpremium_players
```

### 4. Format Commands Produk

Di admin panel, saat menambah produk, isi commands (satu per baris):

```
# Contoh Rank VIP (LuckPerms):
lp user {username} parent set vip
broadcast §6{username} §fbaru saja membeli §6Rank VIP§f!

# Contoh Weapon:
give {username} diamond_sword 1

# Contoh SellWand (plugin SellWand):
sellwand give {username} 500

# Contoh AuraSkills:
auraskills addxp {username} fighting 5000

# Contoh Crate Key:
crates key give {username} legendary 1
```

`{username}` akan otomatis diganti dengan username player yang membeli.

---

## 💳 SETUP MIDTRANS (QRIS)

1. Daftar di https://dashboard.midtrans.com
2. Buka **Settings → Access Keys**
3. Copy **Server Key** dan **Client Key**
4. Masukkan ke `.env.local`
5. Mode sandbox untuk testing, production untuk live

**Webhook URL** (wajib diset di Midtrans Dashboard):
```
https://domain-kamu.com/api/orders/webhook
```

---

## 🔐 AKSES ADMIN PANEL

URL: `https://domain-kamu.com/admin`

Default credentials (ubah di `.env.local`):
- Username: `admin`
- Password: sesuai `ADMIN_PASSWORD` di env

**Fitur Admin Panel:**
- 📊 Dashboard statistik (revenue, orders, dll)
- 📦 Tambah/Edit/Hapus produk (nama, harga, gambar, fitur, commands)
- 📁 Kelola kategori (Rank, Weapon, SellWand, dll)
- 🛒 Lihat semua orders + manual execute commands
- ⚙️ Edit settings website (nama server, IP, announcement, dll)

---

## ❓ TROUBLESHOOTING

**Login player gagal "Username tidak ditemukan"**
→ Pastikan `# Tidak diperlukan lagi — semua dalam 1 database
→ Cek nama tabel: `SHOW TABLES;` di database Minecraft

**Payment berhasil tapi item tidak masuk**
→ Cek RCON (`RCON_HOST`, `RCON_PASSWORD`) di env
→ Pastikan `enable-rcon=true` di server.properties
→ Di admin panel → Orders → klik "Eksekusi" manual

**Website tidak bisa akses database**
→ Vercel: pastikan DB bisa diakses dari luar (bukan localhost)
→ VPS: cek firewall, pastikan port 3306 terbuka (hanya untuk IP website)

---

## 📞 SUPPORT

Hubungi via Discord server kamu untuk bantuan setup.

---

## 🔑 CATATAN KHUSUS: LOGIN JPREMIUM

Website menggunakan **tabel JPremium** untuk autentikasi player, bukan AuthMe.

### Cara Kerja Login

| Tipe Player | Cara Login |
|---|---|
| **Premium** (beli Minecraft asli) | Bisa login tanpa password, atau dengan password /register jika punya |
| **Cracked / Non-Premium** | Wajib input password yang sama dengan `/register` di server |

### Tabel yang dipakai (dibuat otomatis JPremium)

```
jpremium_players   → menyimpan UUID + nama + status premium
jpremium_accounts  → menyimpan password BCrypt player non-premium
```

### Syarat agar login berfungsi

1. Plugin **JPremium** sudah pernah dijalankan di server → tabel sudah terbuat
2. `DB_NAME` di `.env.local` = nama database yang **sama** dengan yang dipakai JPremium di `config.yml`
3. Player sudah pernah **join ke server** minimal sekali (agar ada data di `jpremium_players`)
4. Player non-premium sudah melakukan **`/register`** di server

### Cek nama database JPremium

Di file `plugins/JPremium/config.yml` server kamu:
```yaml
database:
  type: MYSQL
  host: localhost
  port: 3306
  database: nama_database_ini  ← isi ini ke DB_NAME di .env.local
  username: user_db
  password: pass_db
```

