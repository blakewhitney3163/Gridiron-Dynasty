import { db } from '../database';
import { DraftProspect } from '../types';

type ProspectInsert = {
  season: number;
  first_name: string;
  last_name: string;
  position: string;
  overall_rating: number;
  dev_trait: string;
  age: number;
};

class DraftRepository {
  getClass(season: number): DraftProspect[] {
    return db.prepare('SELECT * FROM draft_prospects WHERE season = ? ORDER BY overall_rating DESC').all(season) as DraftProspect[];
  }

  getById(id: number): DraftProspect | null {
    return db.prepare('SELECT * FROM draft_prospects WHERE id = ?').get(id) as DraftProspect ?? null;
  }

  getUndrafted(season: number): DraftProspect[] {
    return db.prepare('SELECT * FROM draft_prospects WHERE season = ? AND is_drafted = 0').all(season) as DraftProspect[];
  }

  countBySeason(season: number): number {
    return (db.prepare('SELECT COUNT(*) as count FROM draft_prospects WHERE season = ?').get(season) as any).count;
  }

  countScouted(season: number): number {
    return (db.prepare('SELECT COUNT(*) as c FROM draft_prospects WHERE season = ? AND scouted = 1').get(season) as any).c;
  }

  insertClass(prospects: ProspectInsert[]): void {
    const ins = db.prepare(`INSERT INTO draft_prospects (season, first_name, last_name, position, overall_rating, dev_trait, age) VALUES (@season, @first_name, @last_name, @position, @overall_rating, @dev_trait, @age)`);
    const run = db.transaction(() => { for (const p of prospects) ins.run(p); });
    run();
  }

  markScouted(id: number): void {
    db.prepare('UPDATE draft_prospects SET scouted = 1 WHERE id = ?').run(id);
  }

  markDrafted(id: number, round: number, pick: number, teamId: number): void {
    db.prepare('UPDATE draft_prospects SET is_drafted = 1, draft_round = ?, draft_pick = ?, drafted_by_team_id = ? WHERE id = ?')
      .run(round, pick, teamId, id);
  }
}

export const draftRepo = new DraftRepository();
