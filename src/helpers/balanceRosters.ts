import { db } from '../database';
import { getCurrentSeason } from './getCurrentSeason';
import { gameRepo } from '../repositories';

export function balanceRosters(): void {
  const season = getCurrentSeason();
  const isInSeason = gameRepo.countBySeason(season) > 0;
  const currentWeek = isInSeason ? (gameRepo.getCurrentWeek(season) ?? 1) : null;

  const teams = db.prepare('SELECT id FROM teams').all() as any[];
  const run = db.transaction(() => {
    for (const team of teams) {
      const players = db.prepare(`
        SELECT id FROM players
        WHERE team_id = ? AND roster_status IN ('active', 'practice_squad')
        ORDER BY overall_rating DESC
      `).all(team.id) as any[];
      players.forEach((p: any, i: number) => {
        if (i < 53) {
          db.prepare(`UPDATE players SET roster_status = 'active' WHERE id = ?`).run(p.id);
        } else if (i < 69) {
          db.prepare(`UPDATE players SET roster_status = 'practice_squad' WHERE id = ?`).run(p.id);
        } else {
          if (isInSeason && currentWeek !== null) {
            db.prepare(`
              UPDATE players SET team_id = NULL, is_free_agent = 0,
              roster_status = 'waivers', waived_by_team_id = ?, waiver_placed_week = ?
              WHERE id = ?
            `).run(team.id, currentWeek, p.id);
          } else {
            db.prepare(`
              UPDATE players SET team_id = NULL, is_free_agent = 1, roster_status = 'free_agent'
              WHERE id = ?
            `).run(p.id);
            db.prepare('DELETE FROM contracts WHERE player_id = ?').run(p.id);
          }
        }
      });
    }
  });
  run();
}
