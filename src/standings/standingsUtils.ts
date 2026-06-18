import { Team } from './types';

export const DIVISION_ORDER = ['East', 'North', 'South', 'West'];

export function pct(w: number, l: number): string {
  const g = w + l;
  return g === 0 ? '.000' : (w / g).toFixed(3);
}

export function gb(leaderW: number, leaderL: number, w: number, l: number): string {
  const diff = (leaderW - w + l - leaderL) / 2;
  return diff === 0 ? '—' : diff.toFixed(1);
}

export function getPlayoffSeeds(teams: Team[], conf: string): Team[] {
  const confTeams = teams.filter(t => t.conference === conf);
  const divs = [...new Set(confTeams.map(t => t.division))];

  const divWinners = divs.map(div => {
    const divTeams = confTeams
      .filter(t => t.division === div)
      .sort((a, b) => b.wins - a.wins || a.losses - b.losses);
    return divTeams[0];
  }).filter(Boolean).sort((a, b) => b.wins - a.wins || a.losses - b.losses) as Team[];

  const divWinnerIds = new Set(divWinners.map(t => t.id));
  const wildcards = confTeams
    .filter(t => !divWinnerIds.has(t.id))
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses)
    .slice(0, 3);

  return [...divWinners, ...wildcards];
}
