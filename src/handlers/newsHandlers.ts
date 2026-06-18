import { ipcMain } from 'electron';
import { db } from '../database';
import { getCurrentSeason } from '../helpers/getCurrentSeason';

export function registerNewsHandlers(): void {
  ipcMain.handle('get-news-feed', (_event: any, opts?: { season?: number; category?: string; limit?: number }) => {
    const season = opts?.season ?? getCurrentSeason();
    const limit  = opts?.limit  ?? 75;
    const params: any[] = [season];

    let query = `
      SELECT n.id, n.season, n.week, n.event_type, n.category,
             n.headline, n.detail, n.player_id, n.created_at,
             t.city || ' ' || t.name AS team_name
      FROM news_events n
      LEFT JOIN teams t ON n.team_id = t.id
      WHERE n.season = ?
    `;

    if (opts?.category && opts.category !== 'all') {
      query += ` AND n.category = ?`;
      params.push(opts.category);
    }

    query += ` ORDER BY n.id DESC LIMIT ?`;
    params.push(limit);

    return db.prepare(query).all(...params);
  });

  ipcMain.handle('get-news-seasons', () =>
    (db.prepare(`SELECT DISTINCT season FROM news_events ORDER BY season DESC`).all() as any[])
      .map((r: any) => r.season)
  );
}
