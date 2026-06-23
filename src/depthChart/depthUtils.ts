// Shared constants and helpers for the depth chart UI

// ─── OVR Color ───────────────────────────────────────────────────────────────

export function ovrColor(ovr: number): string {
  if (ovr >= 90) return '#FFD700';
  if (ovr >= 80) return '#4FC3F7';
  if (ovr >= 70) return '#81C784';
  return '#888888';
}

// ─── Dev Trait Meta ───────────────────────────────────────────────────────────

export const TRAIT_META: Record<string, { short: string; color: string; bg: string }> = {
  'X-Factor': { short: 'XF',  color: '#fff',    bg: '#f97316' },
  'Superstar': { short: 'SS',  color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
  'Star':      { short: 'S',   color: '#4FC3F7', bg: 'rgba(79,195,247,0.15)' },
  'Normal':    { short: '',    color: '#555',    bg: 'transparent' },
};

// ─── Injury Meta ─────────────────────────────────────────────────────────────

export function injuryMeta(status: string): { label: string; bg: string; color: string } | null {
  switch (status) {
    case 'questionable': return { label: 'Q',   bg: 'rgba(255,215,0,0.12)',   color: '#FFD700' };
    case 'doubtful':     return { label: 'D',   bg: 'rgba(255,135,64,0.12)',  color: '#FF8740' };
    case 'out':          return { label: 'OUT', bg: 'rgba(229,115,115,0.12)', color: '#e57373' };
    case 'ir':           return { label: 'IR',  bg: 'rgba(229,115,115,0.18)', color: '#e57373' };
    default:             return null;
  }
}

// ─── Position Group Labels ────────────────────────────────────────────────────

export const GROUP_LABELS: Record<string, string> = {
  QB:  'Quarterback',
  HB:  'Halfback',
  FB:  'Fullback',
  WR:  'Wide Receiver',
  TE:  'Tight End',
  LT:  'Left Tackle',
  LG:  'Left Guard',
  C:   'Center',
  RG:  'Right Guard',
  RT:  'Right Tackle',
  DE:  'Defensive End',
  DT:  'Defensive Tackle',
  MLB: 'Middle Linebacker',
  OLB: 'Outside Linebacker',
  CB:  'Cornerback',
  FS:  'Free Safety',
  SS:  'Strong Safety',
  K:   'Kicker',
};

export const POSITION_GROUPS = Object.keys(GROUP_LABELS);
