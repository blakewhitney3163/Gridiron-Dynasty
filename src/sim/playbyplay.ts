export interface PlayEntry {
  quarter: number;
  teamName: string;
  description: string;
  type: 'td' | 'fg' | 'turnover' | 'bigplay';
  homeScore: number;
  awayScore: number;
}

export interface PlayByPlayInput {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homePlayers: PlayerStat[];
  awayPlayers: PlayerStat[];
}

export interface PlayerStat {
  name: string;
  position: string;
  pass_yards: number;
  rush_yards: number;
  rec_yards: number;
  interceptions: number;
  sacks: number;
  rush_tds: number;
  pass_tds: number;
  rec_tds: number;
}

const TD_PASS = [
  (qb: string, wr: string, y: number) => `${qb} fires a ${y}-yard strike to ${wr} — TOUCHDOWN`,
  (qb: string, wr: string, y: number) => `${qb} finds ${wr} open in the end zone from ${y} out`,
  (qb: string, wr: string, y: number) => `Play-action — ${qb} hits ${wr} for ${y} yards and 6`,
  (qb: string, wr: string, y: number) => `${qb} lobs it to ${wr}, who hauls it in for a ${y}-yard score`,
];
const TD_RUN = [
  (rb: string, y: number) => `${rb} punches it in from ${y} out`,
  (rb: string, y: number) => `${rb} finds the crease — ${y}-yard touchdown run`,
  (rb: string, y: number) => `${rb} breaks free for a ${y}-yard score`,
  (rb: string, y: number) => `Up the gut, ${rb} bulls in from ${y} out`,
];
const FG_T = [
  (k: string, y: number) => `${k} connects on the ${y}-yard field goal — it's good`,
  (k: string, y: number) => `${k} splits the uprights from ${y} yards out`,
  (k: string, y: number) => `${k} is true from ${y} — 3 points on the board`,
];
const TURNOVER_T = [
  (d: string, y: number) => `Interception! ${d} picks it off and returns it ${y} yards`,
  (d: string, _: number) => `Fumble recovered by ${d} — turnover on the field`,
  (d: string, y: number) => `${d} jumps the route and takes it back ${y} yards`,
];
const BIGPLAY_T = [
  (p: string, y: number) => `${p} breaks free down the sideline — ${y}-yard gain`,
  (p: string, y: number) => `${p} takes the catch and goes ${y} yards`,
  (p: string, y: number) => `${p} outruns the secondary for a ${y}-yard play`,
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rnd(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function assignQ(): number {
  const r = Math.random();
  if (r < 0.22) return 1; if (r < 0.50) return 2; if (r < 0.70) return 3; return 4;
}

function decompose(score: number): { tds: number; fgs: number } {
  let rem = score, tds = 0;
  while (rem >= 7) { tds++; rem -= 7; }
  return { tds, fgs: Math.floor(rem / 3) };
}

function top(players: PlayerStat[], positions: string[], stat: keyof PlayerStat): PlayerStat | null {
  const pool = players.filter(p => positions.includes(p.position));
  if (!pool.length) return null;
  return pool.sort((a, b) => ((b[stat] as number) ?? 0) - ((a[stat] as number) ?? 0))[0];
}

export function generatePlayLog(input: PlayByPlayInput): PlayEntry[] {
  const entries: PlayEntry[] = [];
  const home = decompose(input.homeScore);
  const away = decompose(input.awayScore);
  let rh = 0, ra = 0;

  const all: { isHome: boolean; type: 'td' | 'fg' }[] = [];
  for (let i = 0; i < home.tds; i++) all.push({ isHome: true,  type: 'td' });
  for (let i = 0; i < home.fgs; i++) all.push({ isHome: true,  type: 'fg' });
  for (let i = 0; i < away.tds; i++) all.push({ isHome: false, type: 'td' });
  for (let i = 0; i < away.fgs; i++) all.push({ isHome: false, type: 'fg' });
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }

  for (const play of all) {
    const players = play.isHome ? input.homePlayers : input.awayPlayers;
    const teamName = play.isHome ? input.homeTeamName : input.awayTeamName;
    let desc = '';

    if (play.type === 'td') {
      if (Math.random() < 0.62) {
        const qb = top(players, ['QB'], 'pass_yards');
        const wr = top(players.filter(p => ['WR','TE','RB','HB'].includes(p.position)), ['WR','TE','RB','HB'], 'rec_yards');
        desc = pick(TD_PASS)(qb?.name ?? 'QB', wr?.name ?? 'WR', rnd(5, 48));
      } else {
        const rb = top(players, ['RB','HB','QB'], 'rush_yards');
        desc = pick(TD_RUN)(rb?.name ?? 'RB', rnd(1, 22));
      }
      if (play.isHome) rh += 7; else ra += 7;
    } else {
      const k = players.find(p => p.position === 'K');
      desc = pick(FG_T)(k?.name ?? 'K', rnd(22, 52));
      if (play.isHome) rh += 3; else ra += 3;
    }
    entries.push({ quarter: assignQ(), teamName, description: desc, type: play.type, homeScore: rh, awayScore: ra });
  }

  const awayQBInts = input.awayPlayers.find(p => p.position === 'QB')?.interceptions ?? 0;
  const homeQBInts = input.homePlayers.find(p => p.position === 'QB')?.interceptions ?? 0;
  if (awayQBInts > 0) {
    const def = input.homePlayers.find(p => ['CB','S','FS','SS','LB'].includes(p.position));
    entries.push({ quarter: assignQ(), teamName: input.homeTeamName, description: pick(TURNOVER_T)(def?.name ?? 'CB', rnd(5, 38)), type: 'turnover', homeScore: rh, awayScore: ra });
  }
  if (homeQBInts > 0) {
    const def = input.awayPlayers.find(p => ['CB','S','FS','SS','LB'].includes(p.position));
    entries.push({ quarter: assignQ(), teamName: input.awayTeamName, description: pick(TURNOVER_T)(def?.name ?? 'CB', rnd(5, 38)), type: 'turnover', homeScore: rh, awayScore: ra });
  }

  for (const s of [...input.homePlayers.map(p => ({ ...p, h: true })), ...input.awayPlayers.map(p => ({ ...p, h: false }))]) {
    if (s.rush_yards >= 80 || s.rec_yards >= 100) {
      const yds = Math.max(s.rush_yards, s.rec_yards);
      entries.push({ quarter: assignQ(), teamName: s.h ? input.homeTeamName : input.awayTeamName, description: pick(BIGPLAY_T)(s.name, rnd(Math.floor(yds * 0.4), Math.floor(yds * 0.65))), type: 'bigplay', homeScore: rh, awayScore: ra });
    }
  }

  entries.sort((a, b) => a.quarter - b.quarter);
  return entries;
}
