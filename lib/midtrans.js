// lib/midtrans.js - Integrasi Midtrans untuk QRIS

/**
 * Midtrans Payment Gateway
 * Mendukung QRIS, Transfer Bank, GoPay, OVO, dll
 * Daftar akun di: https://dashboard.midtrans.com
 */

const MIDTRANS_BASE_URL = process.env.MIDTRANS_ENV === 'production'
  ? 'https://app.midtrans.com'
  : 'https://app.sandbox.midtrans.com';

const MIDTRANS_API_URL = process.env.MIDTRANS_ENV === 'production'
  ? 'https://api.midtrans.com'
  : 'https://api.sandbox.midtrans.com';

function getAuthHeader() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  return 'Basic ' + Buffer.from(serverKey + ':').toString('base64');
}

/**
 * Buat transaksi Snap (modal pembayaran Midtrans)
 * Mendukung QRIS, Transfer Bank, E-Wallet
 */
export async function createSnapTransaction(orderData) {
  const { orderId, amount, playerUsername, productName, email } = orderData;

  const payload = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
    customer_details: {
      first_name: playerUsername,
      email: email || `${playerUsername}@player.mc`,
    },
    item_details: [
      {
        id: orderId,
        price: amount,
        quantity: 1,
        name: productName.substring(0, 50),
        category: 'Minecraft Item',
      },
    ],
    enabled_payments: ['qris', 'gopay', 'bank_transfer', 'shopeepay'],
    qris: { acquirer: 'gopay' },
    expiry: {
      start_time: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' +0700',
      unit: 'hours',
      duration: 24,
    },
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_BASE_URL}/store?order=${orderId}&status=success`,
      error: `${process.env.NEXT_PUBLIC_BASE_URL}/store?order=${orderId}&status=error`,
      pending: `${process.env.NEXT_PUBLIC_BASE_URL}/store?order=${orderId}&status=pending`,
    },
  };

  const response = await fetch(`${MIDTRANS_BASE_URL}/snap/v1/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_messages?.join(', ') || 'Gagal membuat transaksi Midtrans');
  }

  return {
    snapToken: data.token,
    redirectUrl: data.redirect_url,
  };
}

/**
 * Cek status transaksi dari Midtrans
 */
export async function checkTransactionStatus(orderId) {
  const response = await fetch(`${MIDTRANS_API_URL}/v2/${orderId}/status`, {
    headers: {
      Authorization: getAuthHeader(),
    },
  });

  return await response.json();
}

/**
 * Verifikasi notifikasi webhook dari Midtrans
 */
export async function verifyWebhookSignature(notification) {
  const crypto = await import('crypto');
  const { order_id, status_code, gross_amount, signature_key } = notification;
  const serverKey = process.env.MIDTRANS_SERVER_KEY;

  const expectedSignature = crypto
    .createHash('sha512')
    .update(order_id + status_code + gross_amount + serverKey)
    .digest('hex');

  return expectedSignature === signature_key;
}

/**
 * Parse status dari notifikasi Midtrans
 */
export function parseTransactionStatus(notification) {
  const { transaction_status, fraud_status, payment_type } = notification;

  let status = 'pending';

  if (transaction_status === 'capture') {
    status = fraud_status === 'accept' ? 'paid' : 'failed';
  } else if (transaction_status === 'settlement') {
    status = 'paid';
  } else if (['cancel', 'deny', 'refund'].includes(transaction_status)) {
    status = 'failed';
  } else if (transaction_status === 'expire') {
    status = 'expired';
  } else if (transaction_status === 'pending') {
    status = 'pending';
  }

  return { status, paymentType: payment_type };
}
