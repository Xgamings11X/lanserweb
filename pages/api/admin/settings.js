// pages/api/admin/settings.js
import { query } from '../../../lib/db';
import { parse } from 'cookie';
import { verifyToken } from '../../../lib/auth';

function requireAdmin(req, res) {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.admin_token || req.headers.authorization?.replace('Bearer ', '');
  const user = verifyToken(token);
  if (!user || user.type !== 'admin') {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  try {
    if (req.method === 'GET') {
      const rows = await query('SELECT setting_key, setting_value FROM site_settings');
      const settings = {};
      for (const r of rows) settings[r.setting_key] = r.setting_value;
      return res.status(200).json({ success: true, settings });
    }

    if (req.method === 'POST') {
      const { settings } = req.body;
      for (const [key, value] of Object.entries(settings)) {
        await query(
          `INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = CURRENT_TIMESTAMP`,
          [key, value, value]
        );
      }
      return res.status(200).json({ success: true, message: 'Settings disimpan' });
    }

    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
}
