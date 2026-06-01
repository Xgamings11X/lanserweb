// pages/api/init.js - Inisialisasi database (jalankan sekali saat setup)
import { initDatabase } from '../../lib/db';

export default async function handler(req, res) {
  // Proteksi dengan secret key
  const { secret } = req.query;
  if (secret !== process.env.JWT_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    await initDatabase();
    return res.status(200).json({ success: true, message: 'Database initialized!' });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
}
