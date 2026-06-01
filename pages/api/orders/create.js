// pages/api/orders/create.js
import { verifyToken } from '../../../lib/auth';
import { query } from '../../../lib/db';
import { createSnapTransaction } from '../../../lib/midtrans';
import { parse } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verifikasi token
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.token || req.headers.authorization?.replace('Bearer ', '');
  const user = verifyToken(token);

  if (!user || user.type !== 'player') {
    return res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu' });
  }

  const { productId, playerUsername, playerUuid } = req.body || {};

  if (!productId) {
    return res.status(400).json({ success: false, message: 'Product ID diperlukan' });
  }

  try {
    // Validasi produk
    const products = await query(
      'SELECT * FROM store_products WHERE id = ? AND is_active = 1 LIMIT 1',
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    const product = products[0];
    const username = playerUsername || user.username;
    const uuid = playerUuid || user.uuid;

    // Generate order ID
    const orderId = `MC-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Simpan order ke database
    await query(
      `INSERT INTO store_orders (order_id, player_username, player_uuid, product_id, product_name, amount, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [orderId, username, uuid, product.id, product.name, product.price]
    );

    // Buat transaksi Midtrans
    const { snapToken, redirectUrl } = await createSnapTransaction({
      orderId,
      amount: product.price,
      playerUsername: username,
      productName: product.name,
    });

    // Update order dengan snap token
    await query(
      'UPDATE store_orders SET midtrans_snap_token = ? WHERE order_id = ?',
      [snapToken, orderId]
    );

    return res.status(200).json({
      success: true,
      orderId,
      snapToken,
      redirectUrl,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal membuat transaksi: ' + error.message,
    });
  }
}
