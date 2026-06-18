import { simulateGame } from './simulateGame';
import { getPlayoffSeeds } from './getStandings';

interface Team { id: number; city: string; name: string; }

function simulateSingleGame(team1: Team, team2: Team): Team {
  const result = simulateGame(team1.id, team2.id) as { homeScore: number; awayScore: number };
  const winner = result.homeScore > result.awayScore ? team1 : team2;
  console.log(` ${team1.city} ${team1.name} ${result.homeScore} - ${result.awayScore} ${team2.city} ${team2.name} → ${winner.city} ${winner.name} advance`);
  return winner;
}

export function simulatePlayoffs(season = 2024): void {
  const seeds = getPlayoffSeeds(season);

  for (const conf of ['AFC', 'NFC'] as const) {
    console.log(`\n=== ${conf} PLAYOFFS ===`);
    const s = seeds[conf];

    console.log('\n--- Wild Card ---');
    const wc1 = simulateSingleGame(s[1], s[6]);
    const wc2 = simulateSingleGame(s[2], s[5]);
    const wc3 = simulateSingleGame(s[3], s[4]);

    console.log('\n--- Divisional ---');
    const div1 = simulateSingleGame(s[0], wc3);
    const div2 = simulateSingleGame(wc1, wc2);

    console.log('\n--- Conference Championship ---');
    const champion = simulateSingleGame(div1, div2);
    console.log(`\n ${conf} CHAMPION: ${champion.city} ${champion.name}`);
  }

  console.log('\n=== SUPER BOWL ===');
  const afcChamp = simulateSingleGame(seeds.AFC[0], seeds.AFC[1]);
  const nfcChamp = simulateSingleGame(seeds.NFC[0], seeds.NFC[1]);
  const sbWinner = simulateSingleGame(afcChamp, nfcChamp);
  console.log(`\n SUPER BOWL CHAMPION: ${sbWinner.city} ${sbWinner.name}`);
}
