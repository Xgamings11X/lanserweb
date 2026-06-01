// lib/settings.js - Helper untuk site settings

import { query } from './db';

export async function getSettings() {
  try {
    const rows = await query('SELECT setting_key, setting_value FROM site_settings');
    const settings = {};
    for (const row of rows) {
      settings[row.setting_key] = row.setting_value;
    }
    return settings;
  } catch {
    return {};
  }
}

export async function getSetting(key, defaultValue = '') {
  try {
    const rows = await query(
      'SELECT setting_value FROM site_settings WHERE setting_key = ? LIMIT 1',
      [key]
    );
    return rows.length > 0 ? rows[0].setting_value : defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function setSetting(key, value) {
  await query(
    `INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = CURRENT_TIMESTAMP`,
    [key, value, value]
  );
}
