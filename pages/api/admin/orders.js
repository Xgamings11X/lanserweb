// pages/api/admin/orders.js
import { query } from '../../../lib/db';
import { parse } from 'cookie';
import { verifyToken } from '../../../lib/auth';
import { executeOrderCommands } from '../../../lib/rcon';

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
      const { page = 1, limit = 20, status } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let whereClause = '';
      const params = [];
      if (status && status !== 'all') {
        whereClause = 'WHERE o.payment_status = ?';
        params.push(status);
      }

      const orders = await query(
        `SELECT o.*, p.name as product_name_full FROM store_orders o
         LEFT JOIN products p ON o.product_id = p.id
         ${whereClause}
         ORDER BY o.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      const [{ total }] = await query(
        `SELECT COUNT(*) as total FROM store_orders o ${whereClause}`,
        params
      );

      return res.status(200).json({ success: true, orders, total, page: parseInt(page) });
    }

    // Manual execute commands
    if (req.method === 'POST') {
      const { orderId, action } = req.body;

      if (action === 'execute_commands') {
        const orders = await query('SELECT * FROM store_orders WHERE order_id = ? LIMIT 1', [orderId]);
        if (orders.length === 0) return res.status(404).json({ error: 'Order not found' });

        const order = orders[0];
        const products = await query('SELECT commands FROM store_products WHERE id = ? LIMIT 1', [order.product_id]);
        
        let commands = [];
        if (products.length > 0 && products[0].commands) {
          try { commands = typeof products[0].commands === 'string' ? JSON.parse(products[0].commands) : products[0].commands; } catch {}
        }

        const results = await executeOrderCommands(commands, order.player_username);
        await query('UPDATE store_orders SET commands_executed = 1, payment_status = "paid" WHERE order_id = ?', [orderId]);

        return res.status(200).json({ success: true, results });
      }

      return res.status(400).json({ error: 'Unknown action' });
    }

    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
}
