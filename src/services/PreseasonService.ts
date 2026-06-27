import { db } from '../database';
import { getCurrentSeason } from '../helpers/getCurrentSeason';

// ─── Generate 4 weeks of preseason games ─────────────────────────────────────
export function generatePreseasonSchedule(season: number): { generated: boolean; games: number } {
  const key = `preseason_generated_${season}`;
  if (db.prepare("SELECT value FROM settings WHERE key = ?").get(key))
    return { generated: false, games: 0 };

  const teams = db.prepare('SELECT id FROM teams').all() as { id: number }[];
  let totalGames = 0;

  // Build 4 weeks of random 16-game matchups with no team playing itself
  db.transaction(() => {
    for (let week = 1; week <= 4; week++) {
      const shuffled = [...teams].sort(() => Math.random() - 0.5);
      for (let i = 0; i + 1 < shuffled.length; i += 2) {
        db.prepare(`
          INSERT INTO games (season, week, home_team_id, away_team_id,
            home_score, away_score, is_simulated, is_playoff, is_preseason)
          VALUES (?, ?, ?, ?, 0, 0, 0, 0, 1)
        `).run(season, week, shuffled[i].id, shuffled[i + 1].id);
        totalGames++;
      }
    }
  })();

  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, '1')").run(key);
  return { generated: true, games: totalGames };
}

// ─── Simulate a single preseason game ─────────────────────────────────────────
export function simulatePreseasonGame(gameId: number): {
  success: boolean; homeScore: number; awayScore: number;
} {
  const game = db.prepare(
    'SELECT * FROM games WHERE id = ? AND is_preseason = 1 AND is_simulated = 0'
  ).get(gameId) as any;
  if (!game) return { success: false, homeScore: 0, awayScore: 0 };

  // Simplified sim: weighted random scores, no player stats
  const homeRatings = db.prepare(`
    SELECT AVG(p.overall_rating) as avg_ovr FROM players p
    WHERE p.team_id = ? AND p.roster_status = 'active'
  `).get(game.home_team_id) as any;
  const awayRatings = db.prepare(`
    SELECT AVG(p.overall_rating) as avg_ovr FROM players p
    WHERE p.team_id = ? AND p.roster_status = 'active'
  `).get(game.away_team_id) as any;

  const homeStr = (homeRatings?.avg_ovr ?? 70) + (Math.random() * 20 - 10);
  const awayStr = (awayRatings?.avg_ovr ?? 70) + (Math.random() * 20 - 10);

  const baseScore = () => Math.floor(7 + Math.random() * 28);
  const homeBonus = homeStr > awayStr ? Math.floor(Math.random() * 7) : 0;
  const awayBonus = awayStr > homeStr ? Math.floor(Math.random() * 7) : 0;

  const homeScore = baseScore() + homeBonus;
  const awayScore = baseScore() + awayBonus;

  db.prepare(
    'UPDATE games SET is_simulated = 1, home_score = ?, away_score = ? WHERE id = ?'
  ).run(homeScore, awayScore, gameId);

  return { success: true, homeScore, awayScore };
}

// ─── Simulate all pending games in a preseason week ───────────────────────────
export function simulatePreseasonWeek(
  week: number, season: number
): { gamesSimmed: number } {
  const pending = db.prepare(`
    SELECT id FROM games
    WHERE season = ? AND week = ? AND is_preseason = 1 AND is_simulated = 0
  `).all(season, week) as { id: number }[];

  for (const g of pending) simulatePreseasonGame(g.id);
  return { gamesSimmed: pending.length };
}

// ─── Status for UI ────────────────────────────────────────────────────────────
export interface PreseasonStatus {
  generated: boolean;
  done: boolean;
  weeksDone: number[];
  games: any[];
}

export function getPreseasonStatus(season: number): PreseasonStatus {
  const key = `preseason_generated_${season}`;
  const generated = !!(db.prepare("SELECT value FROM settings WHERE key = ?").get(key));

  if (!generated) return { generated: false, done: false, weeksDone: [], games: [] };

  const games = db.prepare(`
    SELECT g.id, g.week, g.home_score, g.away_score, g.is_simulated,
           ht.id as home_team_id, ht.city as home_city, ht.name as home_name, ht.abbreviation as home_abbr,
           at.id as away_team_id, at.city as away_city, at.name as away_name, at.abbreviation as away_abbr
    FROM games g
    JOIN teams ht ON ht.id = g.home_team_id
    JOIN teams at ON at.id = g.away_team_id
    WHERE g.season = ? AND g.is_preseason = 1
    ORDER BY g.week, g.id
  `).all(season) as any[];

  const weeksDone: number[] = [];
  for (let w = 1; w <= 4; w++) {
    const wGames = games.filter((g: any) => g.week === w);
    if (wGames.length > 0 && wGames.every((g: any) => g.is_simulated)) weeksDone.push(w);
  }

  return { generated: true, done: weeksDone.length === 4, weeksDone, games };
}
