import { T } from '../theme';

export const POSITIONS = ['ALL','QB','RB','WR','TE','OL','DL','LB','CB','S','K'];

// ─── Attribute-Grade Scouting ─────────────────────────────────────────────────

/** Position-specific attributes shown as letter grades in scouting. */
export const POSITION_ATTRS: Record<string, string[]> = {
  QB:  ['Accuracy', 'Arm Strength', 'Mobility', 'Decision Making', 'Pocket Presence'],
  RB:  ['Speed', 'Elusiveness', 'Power', 'Receiving', 'Pass Protection'],
  WR:  ['Speed', 'Route Running', 'Hands', 'Separation', 'YAC Ability'],
  TE:  ['Speed', 'Route Running', 'Hands', 'Blocking', 'Frame'],
  OL:  ['Pass Blocking', 'Run Blocking', 'Strength', 'Technique'],
  DL:  ['Pass Rush', 'Run Defense', 'Strength', 'Motor'],
  DE:  ['Pass Rush', 'Run Defense', 'Strength', 'Motor'],
  LB:  ['Coverage', 'Run Stopping', 'Pass Rush', 'Instincts'],
  CB:  ['Coverage', 'Speed', 'Press Coverage', 'Ball Hawk'],
  S:   ['Coverage', 'Tackling', 'Range', 'Ball Hawk'],
  FS:  ['Coverage', 'Tackling', 'Range', 'Ball Hawk'],
  SS:  ['Coverage', 'Tackling', 'Range', 'Ball Hawk'],
  K:   ['Leg Strength', 'FG Accuracy', 'Kickoffs'],
  P:   ['Leg Strength', 'Hang Time', 'Directional Punting'],
};

/** Convert a numeric score (0–100) to an NFL-style letter grade. */
export function gradeFromScore(score: number): string {
  if (score >= 93) return 'A+';
  if (score >= 87) return 'A';
  if (score >= 82) return 'A-';
  if (score >= 77) return 'B+';
  if (score >= 72) return 'B';
  if (score >= 67) return 'B-';
  if (score >= 62) return 'C+';
  if (score >= 57) return 'C';
  if (score >= 52) return 'C-';
  if (score >= 46) return 'D+';
  if (score >= 40) return 'D';
  return 'F';
}

/** Color for a grade string. */
export function gradeColor(grade: string): string {
  if (grade === 'A+' || grade === 'A')  return '#FFD700';
  if (grade === 'A-' || grade === 'B+') return '#4caf50';
  if (grade === 'B'  || grade === 'B-') return '#4FC3F7';
  if (grade === 'C+' || grade === 'C')  return '#FF8740';
  if (grade === 'C-' || grade === 'D+') return '#e57373';
  return T.textMuted;
}

/**
 * Generate position-specific attribute grades for a prospect.
 * Each attribute is OVR ± noise (~±12 pts) so players have uneven skill profiles.
 * Called server-side during draft class generation; stored as JSON in the DB.
 */
export function generateAttributes(position: string, ovr: number): Record<string, string> {
  const attrs = POSITION_ATTRS[position] ?? POSITION_ATTRS['OL'];
  const result: Record<string, string> = {};
  for (const attr of attrs) {
    const noise = (Math.random() - 0.5) * 24; // ±12 pts
    result[attr] = gradeFromScore(Math.max(20, Math.min(99, ovr + noise)));
  }
  return result;
}

export const ROUND_LABELS: Record<number, string> = {
  1:'1st', 2:'2nd', 3:'3rd', 4:'4th', 5:'5th', 6:'6th', 7:'7th',
};

export const TRAIT_META: Record<string, { color: string; short: string; bg: string }> = {
  Normal: { color: T.textDim, short: '', bg: 'transparent' },
  Star: { color: '#4FC3F7', short: 'S', bg: '#2d3f5a' },
  Superstar: { color: '#FF8740', short: 'SS', bg: '#4a3020' },
  'X-Factor': { color: '#FFD700', short: 'XF', bg: '#4a4020' },
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

/** Returns a ±5 OVR range shown after the first scout, before the deep scout. */
export function partialOvrRange(id: number, ovr: number): string {
  const offset = ((id * 11) % 7) - 3;
  const lo = Math.max(50, ovr + offset - 3);
  const hi = Math.min(99, ovr + offset + 4);
  return `${lo}–${hi}`;
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

export const COMBINE_PRIMARY: Record<string, string> = {
  QB: 'forty_time', RB: 'forty_time', WR: 'forty_time',
  TE: 'bench_press', OL: 'bench_press', DL: 'bench_press',
  LB: 'forty_time', CB: 'forty_time', S: 'forty_time', K: 'bench_press',
};

export function fortyColor(t: number): string {
  if (t <= 4.38) return '#FFD700';
  if (t <= 4.50) return '#4caf50';
  if (t <= 4.65) return '#FF8740';
  return T.textMuted;
}

export function benchColor(reps: number): string {
  if (reps >= 28) return '#FFD700';
  if (reps >= 22) return '#4caf50';
  if (reps >= 15) return '#FF8740';
  return T.textMuted;
}

export function vertColor(inches: number): string {
  if (inches >= 40) return '#FFD700';
  if (inches >= 36) return '#4caf50';
  if (inches >= 32) return '#FF8740';
  return T.textMuted;
}

export function coneColor(t: number): string {
  if (t <= 6.80) return '#FFD700';
  if (t <= 7.10) return '#4caf50';
  if (t <= 7.40) return '#FF8740';
  return T.textMuted;
}
