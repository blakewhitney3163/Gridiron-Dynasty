const { db } = require('../database');

export function getCurrentSeason(): number {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'current_season'").get() as any;
  return row ? parseInt(row.value) : 2025;
}
