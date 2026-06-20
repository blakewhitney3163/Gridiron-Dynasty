import type { WeatherType, WeatherMultipliers, ScoringEvents, TeamRatings } from './types';
import { randomNormal } from './ratings';

// ─── Weather ──────────────────────────────────────────────────────────────────

export function getWeather(week: number): WeatherType {
  const lsf = Math.max(0, (week - 8) / 9);
  const r = Math.random();
  if (r < 0.05 + lsf * 0.15) return 'snow';
  if (r < 0.15 + lsf * 0.20) return 'rain';
  if (r < 0.25 + lsf * 0.10) return 'wind';
  return 'clear';
}

export function weatherMultipliers(w: WeatherType): WeatherMultipliers {
  switch (w) {
    case 'snow': return { score: 0.84, passYards: 0.74, compPct: -0.07, rushYards: 1.06, rushAttempts: 1.08 };
    case 'rain': return { score: 0.92, passYards: 0.87, compPct: -0.03, rushYards: 1.02, rushAttempts: 1.04 };
    case 'wind': return { score: 0.90, passYards: 0.80, compPct: -0.05, rushYards: 1.00, rushAttempts: 1.02 };
    default:     return { score: 1.00, passYards: 1.00, compPct: 0.00,  rushYards: 1.00, rushAttempts: 1.00 };
  }
}

// ─── Scoring Engine ───────────────────────────────────────────────────────────

export function generateScoringEvents(
  offenseRating: number,
  defenseRating: number,
  wx: WeatherMultipliers,
  isHome: boolean
): ScoringEvents {
  const efficiencyRatio = (offenseRating / Math.max(defenseRating, 50)) * wx.score;
  const baseDrives = isHome ? 4.4 : 3.9;
  const scoringDrives = Math.max(0, Math.round(randomNormal(baseDrives * efficiencyRatio, 1.1)));

  const tdRate = Math.min(0.78, Math.max(0.42,
    0.60 + (offenseRating - 75) * 0.004 + (isHome ? 0.02 : 0)
  ));

  let tds = 0, fgs = 0;
  for (let i = 0; i < scoringDrives; i++) {
    if (Math.random() < tdRate) tds++;
    else fgs++;
  }
  return { tds, fgs };
}

// ─── Overtime ─────────────────────────────────────────────────────────────────

export function simulateOvertime(
  homeRatings: TeamRatings,
  awayRatings: TeamRatings,
  wx: WeatherMultipliers
): { homeOTScore: number; awayOTScore: number } {
  const homeFirst = Math.random() > 0.5;
  const firstOff  = homeFirst ? homeRatings : awayRatings;
  const secondOff = homeFirst ? awayRatings : homeRatings;

  function possession(offR: number, defR: number): 'td' | 'fg' | 'none' {
    const eff = (offR / Math.max(defR, 50)) * wx.score;
    if (Math.random() >= Math.min(0.78, 0.54 * eff)) return 'none';
    return Math.random() < 0.56 ? 'td' : 'fg';
  }

  const r1 = possession(firstOff.offenseRating, secondOff.defenseRating);
  if (r1 === 'td') return homeFirst ? { homeOTScore: 7, awayOTScore: 0 } : { homeOTScore: 0, awayOTScore: 7 };
  if (r1 === 'fg') {
    const r2 = possession(secondOff.offenseRating, firstOff.defenseRating);
    if (r2 === 'td') return homeFirst ? { homeOTScore: 3, awayOTScore: 7 } : { homeOTScore: 7, awayOTScore: 3 };
    if (r2 === 'fg') return Math.random() > 0.5
      ? (homeFirst ? { homeOTScore: 6, awayOTScore: 3 } : { homeOTScore: 3, awayOTScore: 6 })
      : (homeFirst ? { homeOTScore: 3, awayOTScore: 6 } : { homeOTScore: 6, awayOTScore: 3 });
    return homeFirst ? { homeOTScore: 3, awayOTScore: 0 } : { homeOTScore: 0, awayOTScore: 3 };
  }
  const r2 = possession(secondOff.offenseRating, firstOff.defenseRating);
  if (r2 !== 'none') {
    const pts = r2 === 'td' ? 7 : 3;
    return homeFirst ? { homeOTScore: 0, awayOTScore: pts } : { homeOTScore: pts, awayOTScore: 0 };
  }
  return { homeOTScore: 3, awayOTScore: 0 };
}

// ─── Quarter Distribution ─────────────────────────────────────────────────────

export function distributeToQuarters(total: number): number[] {
  const quarters = [0, 0, 0, 0];
  const qWeights = [0.21, 0.28, 0.21, 0.30];
  let remaining = total;
  while (remaining >= 2) {
    let pts: number;
    if (remaining >= 7 && Math.random() < 0.55) pts = 7;
    else if (remaining >= 3 && Math.random() < 0.85) pts = 3;
    else pts = 2;
    const r = Math.random();
    let q = 3, cum = 0;
    for (let i = 0; i < 4; i++) { cum += qWeights[i]; if (r < cum) { q = i; break; } }
    quarters[q] += pts;
    remaining -= pts;
  }
  if (remaining > 0) quarters[Math.floor(Math.random() * 4)] += remaining;
  return quarters;
}
