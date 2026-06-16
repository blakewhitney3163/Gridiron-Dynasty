// Central color palette — import as: import { T } from './theme';
export const T = {
  // Backgrounds
  bgPage:   '#444',
  bgPanel:  '#4e4e4e',
  bgCard:   '#585858',
  bgInput:  '#474747',
  bgDeep:   '#333',

  // Borders — these were broken (same value as bgPage)
  borderFaint:  '#5a5a5a',
  borderMid:    '#686868',
  borderStrong: '#787878',

  // Text
  textPrimary:   '#f0f0f0',
  textSecondary: '#b5b5b5',
  textMuted:     '#999',
  textDim:       '#777',

  // Accents (unchanged)
  gold:   '#FFD700',
  green:  '#4caf50',
  blue:   '#4FC3F7',
  orange: '#FF8740',
  red:    '#e57373',

  // Tinted backgrounds — lightened to work with charcoal base
  bgGreen:    '#2d4a35',
  bgBlue:     '#2d3f5a',
  bgOrange:   '#4a3020',
  bgGold:     '#4a4020',
  bgRed:      '#4a2525',
  bgSelected: '#2d4570',
} as const;