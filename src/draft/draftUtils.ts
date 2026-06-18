import { T } from '../theme';

export const POSITIONS = ['ALL','QB','RB','WR','TE','OL','DL','LB','CB','S','K'];

export const ROUND_LABELS: Record<number, string> = {
  1:'1st', 2:'2nd', 3:'3rd', 4:'4th', 5:'5th', 6:'6th', 7:'7th',
};

export const TRAIT_META: Record<string, { color: string; short: string }> = {
  Normal:     { color: T.textDim,  short: '' },
  Star:       { color: '#4FC3F7', short: 'S' },
  Superstar:  { color: '#FF8740', short: 'SS' },
  'X-Factor': { color: '#FFD700', short: 'XF' },
};

export const MAX_SCOUTS = 25;

export function ovrColor(r: number): string {
  return r >= 78 ? '#4caf50' : r >= 74 ? '#FF8740' : r >= 70 ? '#4FC3F7' : T.textMuted;
}

export function draftGrade(ovr: number): { grade: string; color: string } {
  if (ovr >= 80) return { grade: 'A',  color: '#FFD700' };
  if (ovr >= 76) return { grade: 'B+', color: '#4caf50' };
  if (ovr >= 72) return { grade: 'B',  color: '#4caf50' };
  if (ovr >= 68) return { grade: 'C',  color: '#FF8740' };
  if (ovr >= 64) return { grade: 'D',  color: '#e57373' };
  return              { grade: 'F',  color: T.textMuted };
}

export function maskedOvr(id: number, actual: number): string {
  const offset = ((id * 7) % 9) - 4;
  const low  = Math.max(50, actual + offset - 3);
  const high = Math.min(99, actual + offset + 4);
  return `${low}–${high}`;
}

export function preScoutTier(id: number, ovr: number): { label: string; color: string } {
  const noise = ((id * 13) % 5) === 0 ? 7 : ((id * 13) % 5) === 1 ? -7 : 0;
  const n = ovr + noise;
  if (n >= 76) return { label: 'Top Prospect', color: '#FFD700' };
  if (n >= 72) return { label: 'Day 1',        color: '#4caf50' };
  if (n >= 68) return { label: 'Day 2',        color: '#FF8740' };
  if (n >= 63) return { label: 'Day 3',        color: '#4FC3F7' };
  return            { label: 'Priority FA',  color: T.textMuted };
}
