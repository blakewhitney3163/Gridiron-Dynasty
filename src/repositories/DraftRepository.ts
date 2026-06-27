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
  forty_time: number;
  bench_press: number;
  vertical_jump: number;
  broad_jump: number;
  cone_time: number;
  projected_overall_pick: number;
  attributes_json: string;
  revealed_attrs: string;
};

class DraftRepository {
  getClass(season: number): DraftProspect[] {
    // Order by projected pick so the list mirrors a real scout board — best actual player
    // is NOT necessarily first. Sleepers appear lower, busts appear higher.
    return db.prepare(
      'SELECT * FROM draft_prospects WHERE season = ? ORDER BY CASE WHEN projected_overall_pick > 0 THEN projected_overall_pick ELSE 999 END ASC, id ASC'
    ).all(season) as DraftProspect[];
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
    // Each scouting level costs 1 action: level-1 = 1 used, level-2 = 2 used
    return (db.prepare('SELECT COALESCE(SUM(scouted), 0) as c FROM draft_prospects WHERE season = ? AND scouted > 0').get(season) as any).c;
  }

  insertClass(prospects: ProspectInsert[]): void {
    const ins = db.prepare(`
      INSERT INTO draft_prospects
        (season, first_name, last_name, position, overall_rating, dev_trait, age,
         forty_time, bench_press, vertical_jump, broad_jump, cone_time,
         projected_overall_pick, attributes_json, revealed_attrs)
      VALUES
        (@season, @first_name, @last_name, @position, @overall_rating, @dev_trait, @age,
         @forty_time, @bench_press, @vertical_jump, @broad_jump, @cone_time,
         @projected_overall_pick, @attributes_json, @revealed_attrs)
    `);
    const run = db.transaction(() => { for (const p of prospects) ins.run(p); });
    run();
  }

  /** Appends `attribute` to the JSON array stored in revealed_attrs. */
  revealAttribute(prospectId: number, attribute: string): void {
    const row = db.prepare('SELECT revealed_attrs FROM draft_prospects WHERE id = ?').get(prospectId) as any;
    if (!row) return;
    const current: string[] = JSON.parse(row.revealed_attrs ?? '[]');
    if (!current.includes(attribute)) {
      current.push(attribute);
      db.prepare('UPDATE draft_prospects SET revealed_attrs = ? WHERE id = ?').run(JSON.stringify(current), prospectId);
    }
  }

  markScouted(id: number): void {
    db.prepare('UPDATE draft_prospects SET scouted = MIN(scouted + 1, 2) WHERE id = ?').run(id);
  }

  markDrafted(id: number, round: number, pick: number, teamId: number): void {
    db.prepare('UPDATE draft_prospects SET is_drafted = 1, draft_round = ?, draft_pick = ?, drafted_by_team_id = ? WHERE id = ?')
      .run(round, pick, teamId, id);
  }
}

export const draftRepo = new DraftRepository();
