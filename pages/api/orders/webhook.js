// pages/api/orders/webhook.js
// Midtrans akan mengirim notifikasi ke URL ini setelah pembayaran
// Set di Midtrans Dashboard: https://dashboard.midtrans.com > Settings > Configuration > Payment Notification URL
// Isi dengan: https://yourdomain.com/api/orders/webhook

import { query } from '../../../lib/db';
import { verifyWebhookSignature, parseTransactionStatus } from '../../../lib/midtrans';
import { executeOrderCommands } from '../../../lib/rcon';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const notification = req.body;
    console.log('📨 Midtrans webhook received:', notification.order_id, notification.transaction_status);

    // Verifikasi signature
    const isValid = await verifyWebhookSignature(notification);
    if (!isValid) {
      console.error('❌ Invalid Midtrans signature');
      return res.status(403).json({ error: 'Invalid signature' });
    }

    const { orderId } = { orderId: notification.order_id };
    const { status, paymentType } = parseTransactionStatus(notification);

    // Cari order
    const orders = await query(
      'SELECT * FROM store_orders WHERE order_id = ? LIMIT 1',
      [orderId]
    );

    if (orders.length === 0) {
      console.error('❌ Order not found:', orderId);
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Update status order
    await query(
      `UPDATE store_orders SET 
       payment_status = ?,
       payment_method = ?,
       midtrans_transaction_id = ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE order_id = ?`,
      [status, paymentType, notification.transaction_id, orderId]
    );

    // Jika pembayaran berhasil & belum dieksekusi
    if (status === 'paid' && !order.commands_executed) {
      console.log(`✅ Payment confirmed for order ${orderId} - ${order.player_username}`);

      // Ambil commands dari produk
      const products = await query(
        'SELECT commands FROM store_products WHERE id = ? LIMIT 1',
        [order.product_id]
      );

      if (products.length > 0 && products[0].commands) {
        let commands = [];
        try {
          commands = typeof products[0].commands === 'string'
            ? JSON.parse(products[0].commands)
            : products[0].commands;
        } catch {}

        if (commands.length > 0) {
          console.log(`🎮 Executing ${commands.length} commands for ${order.player_username}`);
          const results = await executeOrderCommands(commands, order.player_username);
          console.log('Command results:', results);
        }
      }

      // Mark as executed
      await query(
        'UPDATE store_orders SET commands_executed = 1 WHERE order_id = ?',
        [orderId]
      );

      console.log(`✅ Order ${orderId} completed successfully`);
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}
