import { db } from '../database';
import { playerRepo, contractRepo, gameRepo } from '../repositories';
import { MAX_ACTIVE_ROSTER, MIN_CPU_ROSTER } from '../constants';
import { getCurrentSeason } from '../helpers/getCurrentSeason';
import { SuccessResult } from '../types';

const MARKET_RATE_TABLE: Record<string, [number, number][]> = {
  QB: [[99,65],[93,50],[88,35],[83,20],[78,10],[73,4],[70,1.5]],
  WR: [[99,45],[93,35],[88,25],[83,16],[78,8],[73,3],[70,1.5]],
  DL: [[99,38],[93,30],[88,22],[83,14],[78,7],[73,3],[70,1.5]],
  CB: [[99,32],[93,25],[88,18],[83,11],[78,5],[73,2.5],[70,1.5]],
  OL: [[99,36],[93,30],[88,24],[83,18],[78,9],[73,3],[70,1.5]],
  LB: [[99,26],[93,20],[88,15],[83,9],[78,4.5],[73,2],[70,1.5]],
  TE: [[99,24],[93,19],[88,14],[83,8],[78,4],[73,2],[70,1.5]],
  S:  [[99,22],[93,17],[88,12],[83,7],[78,3.5],[73,1.8],[70,1.5]],
  RB: [[99,18],[93,14],[88,10],[83,6],[78,3],[73,1.5],[70,1.2]],
  K:  [[99,8],[93,6],[88,5],[83,4],[78,3],[73,2],[70,1]],
};
const TRAIT_MUL: Record<string, number> = { Normal: 1.0, Star: 1.1, Superstar: 1.25, 'X-Factor': 1.45 };

export function calcFairMarket(ovr: number, position: string, devTrait: string): number {
  const rates = MARKET_RATE_TABLE[position] ?? MARKET_RATE_TABLE['LB'];
  let base = rates[rates.length - 1][1];
  for (let i = 0; i < rates.length - 1; i++) {
    const [highOvr, highSal] = rates[i];
    const [lowOvr, lowSal] = rates[i + 1];
    if (ovr >= lowOvr) {
      const t = (ovr - lowOvr) / (highOvr - lowOvr);
      base = lowSal + t * (highSal - lowSal);
      break;
    }
  }
  return Math.round(base * (TRAIT_MUL[devTrait] ?? 1.0) * 10) / 10;
}

export function signFreeAgent(
  playerId: number, teamId: number, years: number, salary: number
): SuccessResult {
  if (playerRepo.getActiveCount(teamId) >= MAX_ACTIVE_ROSTER)
    return { success: false, reason: `Active roster is full (${MAX_ACTIVE_ROSTER}/${MAX_ACTIVE_ROSTER}). Release a player first.` };

  const player = playerRepo.getById(playerId);
  if (!player) return { success: false, reason: 'Player not found.' };

  const fairMarket = calcFairMarket(player.overall_rating, player.position, player.dev_trait);
  const ratio = salary / Math.max(fairMarket, 1);
  let acceptChance =
    ratio >= 1.00 ? 1.00 : ratio >= 0.85 ? 0.90 : ratio >= 0.70 ? 0.60 : ratio >= 0.50 ? 0.20 : 0.00;

  if (player.age >= 33) acceptChance = Math.min(1, acceptChance + 0.15);
  if (player.age >= 36) acceptChance = Math.min(1, acceptChance + 0.15);
  if (player.dev_trait === 'X-Factor') acceptChance = Math.max(0, acceptChance - 0.20);
  if (player.dev_trait === 'Superstar') acceptChance = Math.max(0, acceptChance - 0.10);

  const { wins, played } = gameRepo.getWinRecord(teamId, getCurrentSeason());
  if (played >= 4 && wins / played >= 0.65) acceptChance = Math.min(1, acceptChance + 0.08);

  if (Math.random() >= acceptChance) {
    const reason =
      ratio < 0.50 ? `Insulted by the offer. ${player.dev_trait === 'X-Factor' || player.dev_trait === 'Superstar' ? 'Elite players' : 'Players'} don't sign for that salary.` :
      ratio < 0.70 ? `Not enough money. Looking for closer to ${fairMarket.toFixed(1)}M/yr on the open market.` :
      ratio < 0.85 ? `Decided to explore other options. Try sweetening the offer slightly.` :
      `Chose to sign elsewhere. Sometimes it just doesn't work out.`;
    return { success: false, reason };
  }

  const guaranteedPct = Math.round(30 + Math.random() * 30);
  playerRepo.activate(playerId, teamId);
  contractRepo.create(playerId, teamId, years, salary, Math.round(salary * years * (guaranteedPct / 100) * 10) / 10, guaranteedPct);
  return { success: true };
}

export function resignPlayer(
  playerId: number, years: number, salary: number
): SuccessResult & { willHitFA?: boolean } {
  const player = playerRepo.getById(playerId);
  if (!player) return { success: false, reason: 'Player not found.' };

  const fairMarket = calcFairMarket(player.overall_rating, player.position, player.dev_trait);
  const ratio = salary / Math.max(fairMarket, 1);
  let acceptChance =
    ratio >= 1.00 ? 1.00 : ratio >= 0.85 ? 0.95 : ratio >= 0.70 ? 0.70 : ratio >= 0.50 ? 0.25 : 0.00;

  if (player.age >= 33) acceptChance = Math.min(1, acceptChance + 0.15);
  if (player.age >= 36) acceptChance = Math.min(1, acceptChance + 0.15);
  if (player.dev_trait === 'X-Factor') acceptChance = Math.max(0, acceptChance - 0.15);
  if (player.dev_trait === 'Superstar') acceptChance = Math.max(0, acceptChance - 0.08);

  if (Math.random() >= acceptChance) {
    const reason =
      ratio < 0.50 ? `Insulted by the offer. Looking for around ${fairMarket.toFixed(1)}M/yr.` :
      ratio < 0.70 ? `Not enough to stay. Asking price is closer to ${fairMarket.toFixed(1)}M/yr.` :
      ratio < 0.85 ? `Wants to test the market. Try offering closer to ${fairMarket.toFixed(1)}M/yr.` :
      `Decided to explore other options despite the offer.`;
    return { success: false, reason, willHitFA: true };
  }

  const guaranteedPct = Math.round(35 + Math.random() * 25);
  contractRepo.update(playerId, years, salary, Math.round(salary * years * (guaranteedPct / 100) * 10) / 10, guaranteedPct);
  return { success: true };
}

export function promoteFromPS(playerId: number, teamId: number): SuccessResult {
  if (playerRepo.getActiveCount(teamId) >= MAX_ACTIVE_ROSTER)
    return { success: false, reason: `Active roster is full (${MAX_ACTIVE_ROSTER}/${MAX_ACTIVE_ROSTER}). Release a player first.` };

  const player = playerRepo.getById(playerId);
  if (!player || player.roster_status !== 'practice_squad')
    return { success: false, reason: 'Player not on practice squad.' };

  playerRepo.updateRosterStatus(playerId, 'active');

  const SAL_RANGES: Record<string, [number, number]> = {
    QB: [1.0, 42], WR: [1.0, 28], DL: [1.0, 32], LB: [1.0, 18],
    CB: [1.0, 22], TE: [1.0, 16], OL: [1.0, 22], S: [1.0, 18],
    RB: [1.0, 16], K: [1.0, 4],
  };
  const [minSal, maxSal] = SAL_RANGES[player.position] ?? [1.0, 10];
  const ovrFactor = Math.pow(Math.max(0, (player.overall_rating - 70)) / 29, 2.5);
  const salary = Math.round((minSal + ovrFactor * (maxSal - minSal)) * 10) / 10;
  const years = player.age <= 25 ? 3 : player.age <= 29 ? 2 : 1;
  contractRepo.update(playerId, years, salary, Math.round(salary * years * 0.3 * 10) / 10, 30);
  return { success: true };
}

export function cpuFASigning(userTeamId: number): { totalSigned: number; teamsActive: number } {
  const cpuTeams = db.prepare('SELECT id FROM teams WHERE id != ?').all(userTeamId) as any[];
  let totalSigned = 0;
  const signingsByTeam: Record<number, number> = {};

  const run = db.transaction(() => {
    for (const team of cpuTeams) {
      let slotsLeft = MAX_ACTIVE_ROSTER - playerRepo.getActiveCount(team.id);
      if (slotsLeft <= 0) continue;

      const posCounts = db.prepare(`SELECT position, COUNT(*) as cnt FROM players WHERE team_id = ? AND roster_status = 'active' GROUP BY position`).all(team.id) as any[];
      const byPos: Record<string, number> = {};
      for (const r of posCounts) byPos[r.position] = r.cnt;

      let teamSigned = 0;
      for (const [pos, minCount] of Object.entries(MIN_CPU_ROSTER)) {
        if (slotsLeft <= 0) break;
        const needed = Math.max(0, (minCount as number) - (byPos[pos] ?? 0));
        for (let i = 0; i < needed && slotsLeft > 0; i++) {
          const fa = playerRepo.getFreeAgents(pos, 1)[0];
          if (!fa) break;
          const fair = calcFairMarket(fa.overall_rating, fa.position, fa.dev_trait);
          const salary = Math.round(fair * (0.90 + Math.random() * 0.15) * 10) / 10;
          const years = fa.age <= 27 ? 2 : 1;
          playerRepo.activate(fa.id, team.id);
          contractRepo.create(fa.id, team.id, years, salary, Math.round(salary * years * 0.30 * 10) / 10, 30);
          totalSigned++;
          teamSigned++;
          slotsLeft--;
        }
      }
      if (teamSigned > 0) signingsByTeam[team.id] = teamSigned;
    }
  });
  run();

  return { totalSigned, teamsActive: Object.keys(signingsByTeam).length };
}
