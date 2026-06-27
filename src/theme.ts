// Central color palette — import as: import { T } from './theme';
export const T = {
  // Backgrounds
  bgPage:   '#131f35',   // dark navy — page base
  bgPanel:  '#1c2e47',   // mid-navy — card surface
  bgCard:   '#243754',   // lifted navy — raised cards
  bgInput:  '#1a2b42',   // input fields
  bgDeep:   '#0d1829',   // deepest — sidebar

  // Borders
  borderFaint:  '#1e293b',   // barely visible separator
  borderMid:    '#334155',   // standard card border (slate-700)
  borderStrong: '#475569',   // emphasis border (slate-600)

  // Text
  textPrimary:   '#f1f5f9',   // slate-100 — headings / key values
  textSecondary: '#cbd5e1',   // slate-300 — body copy
  textMuted:     '#94a3b8',   // slate-400 — labels / secondary info
  textDim:       '#64748b',   // slate-500 — de-emphasized / placeholders

  // Accents
  gold:   '#fbbf24',   // amber-400
  green:  '#4ade80',   // green-400
  blue:   '#60a5fa',   // blue-400
  orange: '#fb923c',   // orange-400
  red:    '#f87171',   // red-400

  // Tinted backgrounds (dark, for badges / highlights)
  bgGreen:    '#052e16',   // very dark green
  bgBlue:     '#172554',   // very dark blue
  bgOrange:   '#431407',   // very dark orange
  bgGold:     '#3d2800',   // very dark amber
  bgRed:      '#450a0a',   // very dark red
  bgSelected: '#1e3a5f',   // selected row / active item
  // Aliases used by some components
  bgDark: '#0d1829',  // same as bgDeep
  text:   '#f1f5f9',  // same as textPrimary
} as const;
