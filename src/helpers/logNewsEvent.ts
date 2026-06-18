import { db } from '../database';
import { getCurrentSeason } from './getCurrentSeason';

export type NewsCategory = 'transactions' | 'injuries' | 'draft' | 'season' | 'milestones';

export function logNewsEvent(params: {
  eventType: string;
  category: NewsCategory;
  headline: string;
  detail?: string;
  teamId?: number | null;
  playerId?: number | null;
  season?: number;
  week?: number;
}): void {
  try {
    const season = params.season ?? getCurrentSeason();
    db.prepare(`
      INSERT INTO news_events (season, week, event_type, category, headline, detail, team_id, player_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      season,
      params.week ?? 0,
      params.eventType,
      params.category,
      params.headline,
      params.detail ?? null,
      params.teamId ?? null,
      params.playerId ?? null,
    );
  } catch (_) {}
}
