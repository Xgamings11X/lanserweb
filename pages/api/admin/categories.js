// pages/api/admin/categories.js
import { query } from '../../../lib/db';
import { parse } from 'cookie';
import { verifyToken } from '../../../lib/auth';

function requireAdmin(req, res) {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.admin_token || req.headers.authorization?.replace('Bearer ', '');
  const user = verifyToken(token);
  if (!user || user.type !== 'admin') { res.status(401).json({ error: 'Unauthorized' }); return false; }
  return true;
}

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  try {
    if (req.method === 'GET') {
      const cats = await query('SELECT * FROM store_categories ORDER BY sort_order ASC');
      return res.status(200).json({ success: true, categories: cats });
    }
    if (req.method === 'POST') {
      const { name, icon, description, sort_order } = req.body;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      await query(
        'INSERT INTO store_categories (name, slug, icon, description, sort_order) VALUES (?, ?, ?, ?, ?)',
        [name, slug, icon || '📦', description || '', parseInt(sort_order) || 0]
      );
      return res.status(201).json({ success: true });
    }
    if (req.method === 'PUT') {
      const { id, name, icon, description, sort_order, is_active } = req.body;
      await query(
        'UPDATE store_categories SET name=?, icon=?, description=?, sort_order=?, is_active=? WHERE id=?',
        [name, icon || '📦', description || '', parseInt(sort_order) || 0, is_active ? 1 : 0, id]
      );
      return res.status(200).json({ success: true });
    }
    if (req.method === 'DELETE') {
      const { id } = req.query;
      await query('UPDATE store_categories SET is_active = 0 WHERE id = ?', [id]);
      return res.status(200).json({ success: true });
    }
    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
}
