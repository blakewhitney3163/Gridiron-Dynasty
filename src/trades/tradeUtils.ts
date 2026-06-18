import { T } from '../theme';
import { DraftPick } from './types';

export const POSITIONS = ['ALL', 'QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K'];

export const ROUND_LABELS: Record<number, string> = {
  1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th', 6: '6th', 7: '7th',
};

export const PICK_VALUES: Record<number, number> = {
  1: 100, 2: 65, 3: 40, 4: 22, 5: 13, 6: 8, 7: 4,
};

export const STATUS_META: Record<string, { color: string; bg: string }> = {
  Contender: { color: '#FFD700', bg: T.bgGold },
  Buyer:     { color: '#4caf50', bg: T.bgGreen },
  Seller:    { color: '#4FC3F7', bg: T.bgBlue },
  Rebuilding:{ color: '#9E9E9E', bg: T.bgPanel },
  Neutral:   { color: '#FF8740', bg: T.bgOrange },
};

export const TRAIT_META: Record<string, { color: string }> = {
  Normal:    { color: T.textDim },
  Star:      { color: '#4FC3F7' },
  Superstar: { color: '#FF8740' },
  'X-Factor':{ color: '#FFD700' },
};

export function ratingColor(r: number): string {
  return r >= 90 ? '#FFD700' : r >= 80 ? '#4caf50' : r >= 70 ? '#FF8740' : T.textMuted;
}

export function trajectory(age: number): { label: string; color: string } {
  if (age <= 26) return { label: '↑ Rising',    color: '#4caf50' };
  if (age <= 30) return { label: '→ Prime',     color: '#FF8740' };
  return              { label: '↓ Declining', color: T.textMuted };
}

export function calcTradeValue(overall: number, age: number, position: string, devTrait = 'Normal'): number {
  const ageFactor   = age <= 23 ? 1.4 : age <= 26 ? 1.25 : age <= 29 ? 1.0 : age <= 32 ? 0.75 : age <= 35 ? 0.5 : 0.3;
  const posFactor: Record<string, number> = { QB: 1.4, CB: 1.15, DL: 1.15, LB: 1.1, WR: 1.1, TE: 1.1, OL: 1.05, S: 1.0, RB: 0.85, K: 0.7 };
  const traitFactor: Record<string, number> = { Normal: 1.0, Star: 1.15, Superstar: 1.3, 'X-Factor': 1.5 };
  return Math.round(overall * ageFactor * (posFactor[position] ?? 1.0) * (traitFactor[devTrait] ?? 1.0));
}

export function calcPickValue(round: number, season: number, currentSeason: number): number {
  return Math.round((PICK_VALUES[round] ?? 4) * (season <= currentSeason ? 1.0 : 0.80));
}

export function pickLabel(pick: DraftPick, currentSeason: number): string {
  const yr = String(pick.season).slice(2);
  const label = `'${yr} ${ROUND_LABELS[pick.round]} Rd`;
  return pick.original_team_id === pick.owner_team_id ? label : `${label} (${pick.original_team_city})`;
}
