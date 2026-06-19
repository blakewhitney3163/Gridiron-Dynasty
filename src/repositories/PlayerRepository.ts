import { db } from '../database';
import { Player, RosterStatus } from '../types';
import { PS_MINIMUM_SALARY } from '../constants';

class PlayerRepository {
  getById(id: number): Player | null {
    return db.prepare('SELECT * FROM players WHERE id = ?').get(id) as Player ?? null;
  }

  getByTeam(teamId: number, status?: RosterStatus): Player[] {
    if (status) {
      return db.prepare(`SELECT * FROM players WHERE team_id = ? AND roster_status = ? ORDER BY overall_rating DESC`).all(teamId, status) as Player[];
    }
    return db.prepare(`SELECT * FROM players WHERE team_id = ? ORDER BY overall_rating DESC`).all(teamId) as Player[];
  }

  getPracticeSquad(teamId: number): any[] {
    return db.prepare(`
      SELECT p.id, p.first_name, p.last_name, p.position, p.position_label,
             p.overall_rating, p.age, p.dev_trait,
             c.annual_salary, c.years_remaining
      FROM players p
      LEFT JOIN contracts c ON c.player_id = p.id
      WHERE p.team_id = ? AND p.roster_status = 'practice_squad'
      ORDER BY p.overall_rating DESC
    `).all(teamId);
  }

  getFreeAgents(position?: string, limit: number = 200): any[] {
  if (position && position !== 'ALL') {
    return db.prepare(`
      SELECT id, first_name, last_name, position, position_label,
             overall_rating, age, dev_trait
      FROM players
      WHERE is_free_agent = 1
        AND (position = ? OR position_label = ?)
      ORDER BY overall_rating DESC LIMIT ?
    `).all(position, position, limit);
  }
  return db.prepare(`
    SELECT id, first_name, last_name, position, position_label,
           overall_rating, age, dev_trait
    FROM players WHERE is_free_agent = 1
    ORDER BY overall_rating DESC LIMIT ?
  `).all(limit);
}

  getOnWaivers(userTeamId?: number): any[] {
    const rows = db.prepare(`
      SELECT id, first_name, last_name, position, position_label,
             overall_rating, age, dev_trait, speed, strength, awareness, waived_by_team_id
      FROM players WHERE roster_status = 'waivers'
      ORDER BY overall_rating DESC
    `).all() as any[];
    if (userTeamId !== undefined) {
      return rows.map((p: any) => ({ ...p, canClaim: p.waived_by_team_id !== userTeamId }));
    }
    return rows;
  }

  getActiveCount(teamId: number): number {
    return (db.prepare("SELECT COUNT(*) as count FROM players WHERE team_id = ? AND roster_status = 'active'").get(teamId) as any).count;
  }

  getPSCount(teamId: number): number {
    return (db.prepare("SELECT COUNT(*) as count FROM players WHERE team_id = ? AND roster_status = 'practice_squad'").get(teamId) as any).count;
  }

  getCountByStatus(teamId: number): { active: number; ps: number } {
    const counts = db.prepare(`SELECT roster_status, COUNT(*) as count FROM players WHERE team_id = ? GROUP BY roster_status`).all(teamId) as any[];
    const active = counts.find((r: any) => r.roster_status === 'active')?.count ?? 0;
    const ps = counts.find((r: any) => r.roster_status === 'practice_squad')?.count ?? 0;
    return { active, ps };
  }

  updateTeam(playerId: number, teamId: number | null): void {
    db.prepare('UPDATE players SET team_id = ? WHERE id = ?').run(teamId, playerId);
  }

  updateRosterStatus(playerId: number, status: RosterStatus): void {
    db.prepare('UPDATE players SET roster_status = ? WHERE id = ?').run(status, playerId);
  }

  activate(playerId: number, teamId: number): void {
    db.prepare("UPDATE players SET team_id = ?, is_free_agent = 0, roster_status = 'active' WHERE id = ?").run(teamId, playerId);
  }

  assignToPS(playerId: number, teamId: number): void {
    db.prepare("UPDATE players SET team_id = ?, roster_status = 'practice_squad', is_free_agent = 0 WHERE id = ?").run(teamId, playerId);
  }

  releaseToWaivers(playerId: number, releasingTeamId: number | null, week: number): void {
    db.prepare("UPDATE players SET team_id = NULL, is_free_agent = 0, roster_status = 'waivers', waived_by_team_id = ?, waiver_placed_week = ? WHERE id = ?")
      .run(releasingTeamId, week, playerId);
  }

  releaseToFA(playerId: number): void {
    db.prepare("UPDATE players SET team_id = NULL, is_free_agent = 1, roster_status = 'free_agent', waived_by_team_id = NULL, waiver_placed_week = NULL WHERE id = ?")
      .run(playerId);
  }

  updateInjury(playerId: number, status: string, weeksOut: number, injuryType: string): void {
    db.prepare("UPDATE players SET injury_status = ?, weeks_out = ?, injury_type = ? WHERE id = ?")
      .run(status, weeksOut, injuryType, playerId);
  }

  advanceInjuryTimers(): void {
    db.prepare("UPDATE players SET weeks_out = MAX(0, weeks_out - 1) WHERE weeks_out > 0").run();
    db.prepare("UPDATE players SET injury_status = 'healthy', injury_type = NULL WHERE weeks_out = 0 AND injury_status != 'healthy'").run();
  }
}

export const playerRepo = new PlayerRepository();
