// pages/api/admin/products.js
import { withAuth } from '../../../lib/auth';
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
      const products = await query(
        `SELECT p.*, c.name as category_name FROM store_products p
         LEFT JOIN categories c ON p.category_id = c.id
         ORDER BY p.sort_order ASC, p.created_at DESC`
      );
      return res.status(200).json({ success: true, products });
    }

    if (req.method === 'POST') {
      const { name, category_id, description, price, original_price, features, commands, image_url, badge, badge_color, sort_order } = req.body;
      if (!name || !price) return res.status(400).json({ success: false, message: 'Name dan price wajib diisi' });

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();

      await query(
        `INSERT INTO store_products (name, slug, category_id, description, price, original_price, features, commands, image_url, badge, badge_color, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name, slug, category_id || null, description || null,
          parseInt(price), original_price ? parseInt(original_price) : null,
          features ? JSON.stringify(features) : '[]',
          commands ? JSON.stringify(commands) : '[]',
          image_url || null, badge || null, badge_color || 'orange',
          parseInt(sort_order) || 0
        ]
      );

      return res.status(201).json({ success: true, message: 'Produk berhasil ditambahkan' });
    }

    if (req.method === 'PUT') {
      const { id, name, category_id, description, price, original_price, features, commands, image_url, badge, badge_color, sort_order, is_active } = req.body;
      if (!id) return res.status(400).json({ success: false, message: 'ID produk diperlukan' });

      await query(
        `UPDATE store_products SET
         name=?, category_id=?, description=?, price=?, original_price=?,
         features=?, commands=?, image_url=?, badge=?, badge_color=?,
         sort_order=?, is_active=?, updated_at=CURRENT_TIMESTAMP
         WHERE id=?`,
        [
          name, category_id || null, description || null,
          parseInt(price), original_price ? parseInt(original_price) : null,
          features ? JSON.stringify(features) : '[]',
          commands ? JSON.stringify(commands) : '[]',
          image_url || null, badge || null, badge_color || 'orange',
          parseInt(sort_order) || 0,
          is_active ? 1 : 0, id
        ]
      );

      return res.status(200).json({ success: true, message: 'Produk berhasil diupdate' });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ success: false, message: 'ID diperlukan' });

      await query('UPDATE store_products SET is_active = 0 WHERE id = ?', [id]);
      return res.status(200).json({ success: true, message: 'Produk dihapus' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: e.message });
  }
}
