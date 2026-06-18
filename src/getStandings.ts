import { db } from './database';

interface TeamRecord {
  id: number; city: string; name: string;
  conference: string; division: string;
  wins: number; losses: number; pct: string;
}

export interface PlayoffSeeds {
  AFC: TeamRecord[];
  NFC: TeamRecord[];
}

export function getStandings(season = 2024): TeamRecord[] {
  const teams = db.prepare(
    'SELECT id, city, name, conference, division FROM teams'
  ).all() as TeamRecord[];

  const rows = db.prepare(`
    SELECT
      t.id AS team_id,
      SUM(CASE
        WHEN (g.home_team_id = t.id AND g.home_score > g.away_score)
          OR (g.away_team_id = t.id AND g.away_score > g.home_score) THEN 1 ELSE 0
      END) AS wins,
      SUM(CASE
        WHEN (g.home_team_id = t.id AND g.home_score < g.away_score)
          OR (g.away_team_id = t.id AND g.away_score < g.home_score) THEN 1 ELSE 0
      END) AS losses
    FROM teams t
    LEFT JOIN games g
      ON (g.home_team_id = t.id OR g.away_team_id = t.id)
      AND g.season = ? AND g.is_simulated = 1
    GROUP BY t.id
  `).all(season) as any[];

  const recordMap: Record<number, { wins: number; losses: number }> = {};
  for (const r of rows) recordMap[r.team_id] = { wins: r.wins ?? 0, losses: r.losses ?? 0 };

  return teams.map(team => {
    const { wins = 0, losses = 0 } = recordMap[team.id] ?? {};
    const totalGames = wins + losses;
    return { ...team, wins, losses, pct: totalGames > 0 ? (wins / totalGames).toFixed(3) : '.000' };
  });
}

export function getPlayoffSeeds(season = 2024): PlayoffSeeds {
  const standings = getStandings(season);
  return {
    AFC: standings.filter(t => t.conference === 'AFC').sort((a, b) => b.wins - a.wins).slice(0, 7),
    NFC: standings.filter(t => t.conference === 'NFC').sort((a, b) => b.wins - a.wins).slice(0, 7),
  };
}
