// Central color palette — import as: import { T } from './theme';
export const T = {
  // Backgrounds — charcoal base like OOTP
  bgPage:   '#2b2b2b',   // main charcoal background
  bgPanel:  '#343434',   // panels, lists
  bgCard:   '#3d3d3d',   // cards, rows, elevated
  bgInput:  '#2f2f2f',   // inputs, selects
  bgDeep:   '#1f1f1f',   // deepest/darkest elements

  // Borders
  borderFaint:  '#444',
  borderMid:    '#505050',
  borderStrong: '#5e5e5e',

  // Text — bright white like OOTP
  textPrimary:   '#f0f0f0',
  textSecondary: '#b5b5b5',
  textMuted:     '#888',
  textDim:       '#666',

  // Accents (unchanged)
  gold:   '#FFD700',
  green:  '#4caf50',
  blue:   '#4FC3F7',
  orange: '#FF8740',
  red:    '#e57373',

  // Tinted panel backgrounds — dark steel blue for section headers (OOTP-style)
  bgGreen:    '#1a3020',
  bgBlue:     '#1c2a40',
  bgOrange:   '#3a2010',
  bgGold:     '#3a3010',
  bgRed:      '#3a1515',
  bgSelected: '#1e3055',
} as const;