import { db } from '../database';
import { logNewsEvent } from '../helpers/logNewsEvent';
import { getSalaryCap } from '../helpers/getSalaryCap';

// ─── City pool shared by expansion and CPU relocation ─────────────────────────

interface CityConfig {
  city: string; name: string; abbreviation: string;
  marketSize: 'large' | 'medium' | 'small'; revenue: number; capacity: number;
}

export const EXPANSION_CITY_POOL: CityConfig[] = [
  { city: 'Portland',       name: 'Pioneers',   abbreviation: 'POR', marketSize: 'medium', revenue: 240, capacity: 61000 },
  { city: 'San Antonio',    name: 'Stallions',  abbreviation: 'SAS', marketSize: 'medium', revenue: 235, capacity: 60000 },
  { city: 'Sacramento',     name: 'Surge',      abbreviation: 'SAC', marketSize: 'small',  revenue: 205, capacity: 55000 },
  { city: 'Salt Lake City', name: 'Sentinels',  abbreviation: 'SLC', marketSize: 'small',  revenue: 198, capacity: 53000 },
  { city: 'Austin',         name: 'Armadillos', abbreviation: 'AUS', marketSize: 'medium', revenue: 245, capacity: 62000 },
  { city: 'Memphis',        name: 'Grizzlies',  abbreviation: 'MEM', marketSize: 'small',  revenue: 195, capacity: 52000 },
  { city: 'Oklahoma City',  name: 'Thunder',    abbreviation: 'OKC', marketSize: 'small',  revenue: 192, capacity: 51000 },
  { city: 'St. Louis',      name: 'Blues',      abbreviation: 'STL', marketSize: 'medium', revenue: 252, capacity: 64000 },
  { city: 'San Diego',      name: 'Surge',      abbreviation: 'SDG', marketSize: 'medium', revenue: 258, capacity: 65000 },
  { city: 'Raleigh',        name: 'Ravens',     abbreviation: 'RAL', marketSize: 'small',  revenue: 200, capacity: 54000 },
  { city: 'Columbus',       name: 'Charge',     abbreviation: 'COL', marketSize: 'small',  revenue: 197, capacity: 53000 },
  { city: 'Louisville',     name: 'Lightning',  abbreviation: 'LOU', marketSize: 'small',  revenue: 193, capacity: 52000 },
  { city: 'Birmingham',     name: 'Bulls',      abbreviation: 'BHM', marketSize: 'small',  revenue: 190, capacity: 51000 },
  { city: 'Hartford',       name: 'Hawks',      abbreviation: 'HFD', marketSize: 'small',  revenue: 188, capacity: 50000 },
  { city: 'San Jose',       name: 'Sharks',     abbreviation: 'SJO', marketSize: 'medium', revenue: 248, capacity: 63000 },
  { city: 'Omaha',          name: 'Outlaws',    abbreviation: 'OMA', marketSize: 'small',  revenue: 185, capacity: 50000 },
  { city: 'Albuquerque',    name: 'Storm',      abbreviation: 'ABQ', marketSize: 'small',  revenue: 183, capacity: 49000 },
  { city: 'Tucson',         name: 'Rattlers',   abbreviation: 'TUC', marketSize: 'small',  revenue: 182, capacity: 49000 },
];

function getAvailableCities(): CityConfig[] {
  const existingCities = new Set(
    (db.prepare('SELECT city FROM teams').all() as any[]).map((t: any) => t.city)
  );
  return EXPANSION_CITY_POOL.filter(c => !existingCities.has(c.city));
}

function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
  return row ? row.value : null;
}
function setSetting(key: string, value: string): void {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}
function getUserTeamId(): number {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'user_team_id'").get() as any;
  return row ? parseInt(row.value, 10) : -1;
}

// ─── Cap Escalation ───────────────────────────────────────────────────────────

export function checkCapEscalation(season: number): void {
  const currentCap = getSalaryCap();
  const increase = Math.round((8 + Math.random() * 7) * 10) / 10;
  const newCap = Math.round((currentCap + increase) * 10) / 10;
  setSetting('salary_cap', String(newCap));
  setSetting(`cap_history_${season}`, String(newCap));
  logNewsEvent({
    eventType: 'league', category: 'season',
    headline: `Salary Cap Rises to $${newCap.toFixed(1)}M`,
    detail: `The league salary cap increases by $${increase.toFixed(1)}M heading into the ${season} season.`,
    season,
  });
}

// ─── Expansion Vote ───────────────────────────────────────────────────────────

export function checkExpansionVote(season: number): void {
  // Need at least 5 seasons of play
  const seasonCount = (db.prepare(
    'SELECT COUNT(DISTINCT season) as cnt FROM games WHERE is_simulated = 1'
  ).get() as any).cnt ?? 0;
  if (seasonCount < 5) return;

  const lastExpansion = parseInt(getSetting('last_expansion_season') ?? '0', 10);
  if (lastExpansion > 0 && season - lastExpansion < 8) return;
  if (Math.random() >= 0.12) return;

  const available = getAvailableCities();
  if (available.length === 0) return;

  const userTeamId = getUserTeamId();
  const allTeams = db.prepare(`
    SELECT t.id, tf.market_size
    FROM teams t LEFT JOIN team_finances tf ON tf.team_id = t.id
  `).all() as any[];

  let votesFor = 0, votesAgainst = 0;
  for (const team of allTeams) {
    if (team.id === userTeamId) continue;
    const ms = team.market_size ?? 'medium';
    const voteFor = ms === 'large' ? Math.random() < 0.60 : ms === 'small' ? Math.random() < 0.30 : Math.random() < 0.50;
    voteFor ? votesFor++ : votesAgainst++;
  }

  const userVote = getSetting(`expansion_user_vote_${season}`);
  if (userVote === 'for') votesFor++;
  else if (userVote === 'against') votesAgainst++;
  else votesFor++; // user abstained → counted as neutral/for

  const total = votesFor + votesAgainst;
  const passed = votesFor > total / 2;

  if (passed) {
    const cityConfig = available[Math.floor(Math.random() * available.length)];
    const divisionCounts = db.prepare(`
      SELECT conference, division, COUNT(*) as cnt FROM teams GROUP BY conference, division
    `).all() as any[];
    divisionCounts.sort((a: any, b: any) => a.cnt - b.cnt);
    const target = divisionCounts[0] as any;

    const insertResult = db.prepare(`
      INSERT INTO teams (name, city, abbreviation, conference, division, is_expansion, stadium_name)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).run(
      cityConfig.name, cityConfig.city, cityConfig.abbreviation,
      target.conference, target.division,
      `${cityConfig.city} Stadium`
    );
    const newTeamId = insertResult.lastInsertRowid as number;

    db.prepare(`
      INSERT OR IGNORE INTO team_finances (team_id, market_size, stadium_capacity, season_revenue, owner_budget)
      VALUES (?, ?, ?, ?, ?)
    `).run(newTeamId, cityConfig.marketSize, cityConfig.capacity, cityConfig.revenue, cityConfig.revenue + 10);

    db.prepare('INSERT OR IGNORE INTO team_chemistry (team_id, chemistry) VALUES (?, 50)').run(newTeamId);

    seedExpansionRoster(newTeamId);

    setSetting('last_expansion_season', String(season));

    try {
      db.prepare(`
        INSERT INTO expansion_history (season, city, name, conference, division, team_id, votes_for, votes_against, passed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(season, cityConfig.city, cityConfig.name, target.conference, target.division, newTeamId, votesFor, votesAgainst);
    } catch {}

    logNewsEvent({
      eventType: 'league', category: 'season',
      headline: `League Votes to Expand — ${cityConfig.city} ${cityConfig.name} Join`,
      detail: `${votesFor}-${votesAgainst} vote approves the ${cityConfig.city} ${cityConfig.name} as an expansion franchise in the ${target.conference} ${target.division}.`,
      season,
    });
  } else {
    try {
      db.prepare(`
        INSERT INTO expansion_history (season, city, name, conference, division, team_id, votes_for, votes_against, passed)
        VALUES (?, ?, ?, ?, ?, NULL, ?, ?, 0)
      `).run(season, '', '', '', '', votesFor, votesAgainst);
    } catch {}
    logNewsEvent({
      eventType: 'league', category: 'season',
      headline: 'League Rejects Expansion Proposal',
      detail: `Expansion vote fails ${votesFor}-${votesAgainst}. The league will remain at its current size.`,
      season,
    });
  }
}

function seedExpansionRoster(teamId: number): void {
  const ROSTER_SLOTS = [
    { pos: 'QB', count: 3 }, { pos: 'RB', count: 5 }, { pos: 'WR', count: 6 },
    { pos: 'TE', count: 3 }, { pos: 'OL', count: 9 }, { pos: 'DL', count: 7 },
    { pos: 'LB', count: 7 }, { pos: 'CB', count: 7 }, { pos: 'S', count: 5 }, { pos: 'K', count: 1 },
  ];
  const LABELS: Record<string, string[]> = {
    QB: ['QB'], RB: ['HB','HB','HB','FB'], WR: ['WR'], TE: ['TE'],
    OL: ['LT','LG','C','RG','RT','LT','LG','RG','RT'],
    DL: ['DE','DE','DT','DT','DE','DT','DE'],
    LB: ['MLB','OLB','OLB','MLB','OLB','OLB','MLB'],
    CB: ['CB'], S: ['FS','SS','FS','SS','FS'], K: ['K'],
  };
  const FNAMES = ['James','Marcus','Tyler','Jordan','Derek','Chris','Mike','Ryan','Jake','Aaron','Kevin','Brandon','Justin','Travis','Logan','Andre','Malik','Isaiah'];
  const LNAMES = ['Smith','Johnson','Williams','Brown','Jones','Davis','Miller','Wilson','Moore','Taylor','Anderson','Thomas','Jackson','White','Harris','Martin'];
  const ri = (lo: number, hi: number) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
  const pick = (arr: string[]) => arr[ri(0, arr.length - 1)];

  const insertPlayer = db.prepare(`
    INSERT INTO players (
      first_name, last_name, position, position_label, age, overall_rating,
      speed, strength, awareness, dev_trait, archetype,
      throw_accuracy, throw_power, catching, route_running,
      tackle_rating, coverage, pass_rush, kickpower, kickaccuracy,
      runblocking, passblocking, team_id, is_free_agent, roster_status
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,'active')
  `);
  const insertContract = db.prepare(`
    INSERT INTO contracts (player_id, team_id, years_total, years_remaining, annual_salary, guaranteed_amount, guaranteed_pct)
    VALUES (?,?,?,?,?,0,10)
  `);

  // Pull up to 30 lowest-rated free agents first
  const faPool = db.prepare(`
    SELECT id, position, overall_rating FROM players
    WHERE is_free_agent = 1 AND roster_status = 'free_agent'
    ORDER BY overall_rating ASC LIMIT 30
  `).all() as any[];

  const usedCounts: Record<string, number> = {};
  db.transaction(() => {
    for (const fa of faPool) {
      const slot = ROSTER_SLOTS.find(s => s.pos === fa.position && (usedCounts[s.pos] ?? 0) < s.count);
      if (!slot) continue;
      usedCounts[slot.pos] = (usedCounts[slot.pos] ?? 0) + 1;
      db.prepare("UPDATE players SET team_id = ?, is_free_agent = 0, roster_status = 'active' WHERE id = ?").run(teamId, fa.id);
      db.prepare('DELETE FROM contracts WHERE player_id = ?').run(fa.id);
      insertContract.run(fa.id, teamId, 1, 1, Math.max(1.0, Math.round(fa.overall_rating * 0.05 * 10) / 10));
    }
  })();

  // Fill remaining slots with generated players
  db.transaction(() => {
    for (const slot of ROSTER_SLOTS) {
      const needed = slot.count - (usedCounts[slot.pos] ?? 0);
      const labels = LABELS[slot.pos] ?? [slot.pos];
      for (let i = 0; i < needed; i++) {
        const ovr = ri(50, 66);
        const base = Math.max(40, ovr - 10);
        const result = insertPlayer.run(
          pick(FNAMES), pick(LNAMES), slot.pos, labels[i % labels.length],
          ri(22, 30), ovr,
          Math.min(99, base + ri(0, 12)), Math.min(99, base + ri(0, 10)), Math.min(99, base + ri(0, 8)),
          'Normal', 'normal',
          40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40,
          teamId
        );
        const pid = result.lastInsertRowid as number;
        insertContract.run(pid, teamId, 1, 1, Math.max(1.0, Math.round(ovr * 0.05 * 10) / 10));
      }
    }
  })();
}

// ─── CPU Relocation ───────────────────────────────────────────────────────────

export function checkCpuRelocation(season: number): void {
  const userTeamId = getUserTeamId();

  const smallMarketTeams = db.prepare(`
    SELECT t.id, t.city, t.name, t.abbreviation
    FROM teams t
    JOIN team_finances tf ON tf.team_id = t.id
    WHERE tf.market_size = 'small' AND t.id != ?
  `).all(userTeamId) as any[];

  const qualifying: any[] = [];
  for (const team of smallMarketTeams) {
    const cooldownKey = `relocated_${team.id}_season`;
    const lastReloc = parseInt(getSetting(cooldownKey) ?? '0', 10);
    if (lastReloc > 0 && season - lastReloc < 10) continue;

    let totalWins = 0, totalPlayed = 0;
    for (let s = season - 2; s < season; s++) {
      if (s <= 0) continue;
      const rec = db.prepare(`
        SELECT
          SUM(CASE WHEN (home_team_id = ? AND home_score > away_score)
                   OR (away_team_id = ? AND away_score > home_score) THEN 1 ELSE 0 END) as wins,
          COUNT(*) as played
        FROM games
        WHERE (home_team_id = ? OR away_team_id = ?)
          AND season = ? AND is_simulated = 1 AND is_playoff = 0
      `).get(team.id, team.id, team.id, team.id, s) as any;
      totalWins += rec?.wins ?? 0;
      totalPlayed += rec?.played ?? 0;
    }
    const winPct = totalPlayed > 0 ? totalWins / totalPlayed : 0.5;
    if (winPct < 0.35) qualifying.push(team);
  }

  if (qualifying.length === 0 || Math.random() >= 0.05) return;

  const team = qualifying[Math.floor(Math.random() * qualifying.length)];
  const available = getAvailableCities();
  if (available.length === 0) return;

  const newCity = available[Math.floor(Math.random() * available.length)];
  const oldCity = team.city;

  db.prepare(`UPDATE teams SET city = ?, abbreviation = ?, relocated_from = ? WHERE id = ?`)
    .run(newCity.city, newCity.abbreviation, oldCity, team.id);
  db.prepare(`UPDATE team_finances SET market_size = ?, stadium_capacity = ?, season_revenue = ? WHERE team_id = ?`)
    .run(newCity.marketSize, newCity.capacity, newCity.revenue, team.id);
  setSetting(`relocated_${team.id}_season`, String(season));

  logNewsEvent({
    eventType: 'league', category: 'season',
    headline: `${oldCity} ${team.name} Relocate to ${newCity.city}`,
    detail: `The franchise moves from ${oldCity} to ${newCity.city}, becoming the ${newCity.city} ${team.name}.`,
    season,
  });
}
