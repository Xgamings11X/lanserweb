/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['i.imgur.com', 'cdn.discordapp.com', 'crafatar.com', 'minotar.net'],
    unoptimized: true,
  },
  // Untuk kompatibilitas webhosting biasa (shared hosting)
  // Uncomment jika pakai export statis (tanpa server-side):
  // output: 'export',
}

module.exports = nextConfig
