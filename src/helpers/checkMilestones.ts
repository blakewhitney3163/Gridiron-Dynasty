import { db } from '../database';
import { logNewsEvent } from './logNewsEvent';

const CAREER_PASS_YD  = [10000, 20000, 30000, 40000, 50000];
const CAREER_PASS_TD  = [100, 200, 300, 400];
const CAREER_RUSH_YD  = [5000, 10000, 15000];
const CAREER_RUSH_TD  = [50, 100];
const CAREER_REC_YD   = [5000, 10000, 15000];
const CAREER_REC_TD   = [50, 100];
const CAREER_REC      = [500, 750, 1000];
const CAREER_SACKS    = [50, 100, 150];
const CAREER_DEF_INT  = [25, 50];

export function checkMilestones(season: number, week: number, playerIds: number[]): void {
  if (playerIds.length === 0) return;

  const ph = playerIds.map(() => '?').join(',');

  const historyRows = db.prepare(`
    SELECT player_id,
      COALESCE(SUM(pass_yards), 0) as pass_yards, COALESCE(SUM(pass_tds), 0) as pass_tds,
      COALESCE(SUM(rush_yards), 0) as rush_yards, COALESCE(SUM(rush_tds), 0) as rush_tds,
      COALESCE(SUM(rec_yards), 0) as rec_yards,  COALESCE(SUM(rec_tds), 0) as rec_tds,
      COALESCE(SUM(receptions), 0) as receptions,
      COALESCE(CAST(SUM(sacks) AS REAL), 0) as sacks,
      COALESCE(SUM(def_interceptions), 0) as def_interceptions
    FROM career_stats_history WHERE player_id IN (${ph}) GROUP BY player_id
  `).all(...playerIds) as any[];

  const currentRows = db.prepare(`
    SELECT s.player_id,
      COALESCE(SUM(s.pass_yards), 0) as pass_yards, COALESCE(SUM(s.pass_tds), 0) as pass_tds,
      COALESCE(SUM(s.rush_yards), 0) as rush_yards, COALESCE(SUM(s.rush_tds), 0) as rush_tds,
      COALESCE(SUM(s.rec_yards), 0) as rec_yards,  COALESCE(SUM(s.rec_tds), 0) as rec_tds,
      COALESCE(SUM(s.receptions), 0) as receptions,
      COALESCE(CAST(SUM(s.sacks) AS REAL), 0) as sacks,
      COALESCE(SUM(s.def_interceptions), 0) as def_interceptions
    FROM stats s JOIN games g ON s.game_id = g.id
    WHERE s.player_id IN (${ph}) AND g.season = ? AND g.is_simulated = 1
    GROUP BY s.player_id
  `).all(...playerIds, season) as any[];

  const achievedRows = db.prepare(
    `SELECT player_id, milestone_key FROM player_milestones WHERE player_id IN (${ph})`
  ).all(...playerIds) as any[];

  const playerRows = db.prepare(
    `SELECT id, first_name, last_name, position, team_id FROM players WHERE id IN (${ph})`
  ).all(...playerIds) as any[];

  const histMap  = new Map(historyRows.map((r: any) => [r.player_id, r]));
  const curMap   = new Map(currentRows.map((r: any) => [r.player_id, r]));
  const achieved = new Set(achievedRows.map((r: any) => `${r.player_id}:${r.milestone_key}`));
  const pMap     = new Map(playerRows.map((r: any) => [r.id, r]));

  const insertMs = db.prepare(
    `INSERT OR IGNORE INTO player_milestones (player_id, milestone_key, achieved_season, achieved_week) VALUES (?, ?, ?, ?)`
  );

  for (const pid of playerIds) {
    const player = pMap.get(pid);
    if (!player) continue;

    const h = histMap.get(pid) ?? {};
    const c = curMap.get(pid)  ?? {};
    const name = `${player.first_name} ${player.last_name}`;
    const pos  = player.position as string;

    const career = {
      pass_yards:        (h.pass_yards        ?? 0) + (c.pass_yards        ?? 0),
      pass_tds:          (h.pass_tds          ?? 0) + (c.pass_tds          ?? 0),
      rush_yards:        (h.rush_yards        ?? 0) + (c.rush_yards        ?? 0),
      rush_tds:          (h.rush_tds          ?? 0) + (c.rush_tds          ?? 0),
      rec_yards:         (h.rec_yards         ?? 0) + (c.rec_yards         ?? 0),
      rec_tds:           (h.rec_tds           ?? 0) + (c.rec_tds           ?? 0),
      receptions:        (h.receptions        ?? 0) + (c.receptions        ?? 0),
      sacks:             (h.sacks             ?? 0) + (c.sacks             ?? 0),
      def_interceptions: (h.def_interceptions ?? 0) + (c.def_interceptions ?? 0),
    };

    const cur = {
      pass_yards:  c.pass_yards  ?? 0,
      pass_tds:    c.pass_tds    ?? 0,
      rush_yards:  c.rush_yards  ?? 0,
      rush_tds:    c.rush_tds    ?? 0,
      rec_yards:   c.rec_yards   ?? 0,
      rec_tds:     c.rec_tds     ?? 0,
    };

    const hit = (key: string, headline: string, detail: string) => {
      const full = `${pid}:${key}`;
      if (achieved.has(full)) return;
      achieved.add(full);
      insertMs.run(pid, key, season, week);
      logNewsEvent({
        eventType: 'milestone', category: 'milestones',
        headline, detail,
        playerId: pid, teamId: player.team_id ?? null,
        season, week,
      });
    };

    // ── Career milestones ──────────────────────────────────────────────────
    for (const t of CAREER_PASS_YD)
      if (career.pass_yards >= t)
        hit(`pass_yd_${t}`, `${name} surpasses ${t.toLocaleString()} career passing yards!`,
            `${pos} · ${career.pass_yards.toLocaleString()} career pass yards and counting`);

    for (const t of CAREER_PASS_TD)
      if (career.pass_tds >= t)
        hit(`pass_td_${t}`, `${name} reaches ${t} career touchdown passes!`,
            `${pos} · ${career.pass_tds} career TD passes`);

    for (const t of CAREER_RUSH_YD)
      if (career.rush_yards >= t)
        hit(`rush_yd_${t}`, `${name} surpasses ${t.toLocaleString()} career rushing yards!`,
            `${pos} · ${career.rush_yards.toLocaleString()} career rushing yards`);

    for (const t of CAREER_RUSH_TD)
      if (career.rush_tds >= t)
        hit(`rush_td_${t}`, `${name} reaches ${t} career rushing touchdowns!`,
            `${pos} · ${career.rush_tds} career rushing TDs`);

    for (const t of CAREER_REC_YD)
      if (career.rec_yards >= t)
        hit(`rec_yd_${t}`, `${name} surpasses ${t.toLocaleString()} career receiving yards!`,
            `${pos} · ${career.rec_yards.toLocaleString()} career receiving yards`);

    for (const t of CAREER_REC_TD)
      if (career.rec_tds >= t)
        hit(`rec_td_${t}`, `${name} reaches ${t} career receiving touchdowns!`,
            `${pos} · ${career.rec_tds} career receiving TDs`);

    for (const t of CAREER_REC)
      if (career.receptions >= t)
        hit(`rec_${t}`, `${name} surpasses ${t} career receptions!`,
            `${pos} · ${career.receptions} career receptions`);

    for (const t of CAREER_SACKS)
      if (career.sacks >= t)
        hit(`sacks_${t}`, `${name} reaches ${t} career sacks!`,
            `${pos} · ${career.sacks.toFixed(1)} career sacks`);

    for (const t of CAREER_DEF_INT)
      if (career.def_interceptions >= t)
        hit(`def_int_${t}`, `${name} surpasses ${t} career interceptions!`,
            `${pos} · ${career.def_interceptions} career INTs`);

    // ── Single-season historic milestones ──────────────────────────────────
    if (cur.pass_yards >= 5000)
      hit(`s${season}_pass_5000`, `${name} surpasses 5,000 passing yards this season!`,
          `${cur.pass_yards.toLocaleString()} pass yards — an elite season`);

    if (cur.pass_tds >= 50)
      hit(`s${season}_pass_td_50`, `${name} reaches 50 touchdown passes this season!`,
          `${cur.pass_tds} TD passes — a historic season`);

    if (cur.rush_yards >= 2000)
      hit(`s${season}_rush_2000`, `${name} surpasses 2,000 rushing yards this season!`,
          `${cur.rush_yards.toLocaleString()} rush yards — a historic feat`);

    if (cur.rec_yards >= 2000)
      hit(`s${season}_rec_2000`, `${name} surpasses 2,000 receiving yards this season!`,
          `${cur.rec_yards.toLocaleString()} receiving yards — an elite season`);

    if (cur.rush_tds >= 20)
      hit(`s${season}_rush_td_20`, `${name} reaches 20 rushing touchdowns this season!`,
          `${cur.rush_tds} rushing TDs — a remarkable season`);
  }
}
