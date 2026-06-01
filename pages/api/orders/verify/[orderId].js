// pages/api/orders/verify/[orderId].js
import { query } from '../../../../lib/db';
import { checkTransactionStatus, parseTransactionStatus } from '../../../../lib/midtrans';
import { executeOrderCommands } from '../../../../lib/rcon';

export default async function handler(req, res) {
  const { orderId } = req.query;

  try {
    const orders = await query('SELECT * FROM store_orders WHERE order_id = ? LIMIT 1', [orderId]);
    if (orders.length === 0) return res.status(404).json({ error: 'Order not found' });

    const order = orders[0];
    if (order.payment_status === 'paid') {
      return res.status(200).json({ status: 'paid', order });
    }

    // Cek ke Midtrans
    const mtStatus = await checkTransactionStatus(orderId);
    const { status } = parseTransactionStatus(mtStatus);

    if (status === 'paid' && !order.commands_executed) {
      await query('UPDATE store_orders SET payment_status = ? WHERE order_id = ?', [status, orderId]);

      const products = await query('SELECT commands FROM store_products WHERE id = ? LIMIT 1', [order.product_id]);
      if (products.length > 0 && products[0].commands) {
        let commands = [];
        try { commands = typeof products[0].commands === 'string' ? JSON.parse(products[0].commands) : products[0].commands; } catch {}
        if (commands.length > 0) await executeOrderCommands(commands, order.player_username);
      }

      await query('UPDATE store_orders SET commands_executed = 1 WHERE order_id = ?', [orderId]);
    }

    return res.status(200).json({ status, order });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
