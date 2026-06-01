// pages/api/auth/login.js
import { verifyMinecraftPlayer, generatePlayerToken } from '../../../lib/auth';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username dan password harus diisi' });
  }

  if (username.length < 2 || username.length > 30) {
    return res.status(400).json({ success: false, message: 'Username tidak valid' });
  }

  try {
    const result = await verifyMinecraftPlayer(username, password);

    if (!result.success) {
      return res.status(401).json({ success: false, message: result.message });
    }

    const token = generatePlayerToken(result.player);

    // Set HTTP-only cookie
    res.setHeader('Set-Cookie', serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      path: '/',
    }));

    return res.status(200).json({
      success: true,
      player: result.player,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server. Coba lagi nanti.',
    });
  }
}
