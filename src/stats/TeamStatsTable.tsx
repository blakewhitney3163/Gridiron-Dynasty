import React from 'react';
import { T } from '../theme';
import { tdBase, thStyle } from './utils';

interface Props {
  rows: any[];
  sortKey: string;
  sortDir: 'asc' | 'desc';
  onSort: (k: string) => void;
  category: string;
}

type ColDef = { key: string; label: string };

const COL_SETS: Record<string, ColDef[]> = {
  passing: [
    { key: 'pass_ypg', label: 'PASS YPG' },
    { key: 'pass_tds', label: 'PASS TDs' },
    { key: 'cmp_pct',  label: 'CMP%' },
    { key: 'to_given', label: 'INTs' },
  ],
  rushing: [
    { key: 'rush_ypg',    label: 'RUSH YPG' },
    { key: 'rush_tds',    label: 'RUSH TDs' },
    { key: 'rush_att_pg', label: 'ATT/G' },
  ],
  defense: [
    { key: 'papg',     label: 'PA/G' },
    { key: 'sacks',    label: 'SACKS' },
    { key: 'def_ints', label: 'DEF INTs' },
    { key: 'to_taken', label: 'TAKEAWAYS' },
  ],
  default: [
    { key: 'ppg',      label: 'PPG' },
    { key: 'papg',     label: 'PAPG' },
    { key: 'ypg',      label: 'YPG' },
    { key: 'to_diff',  label: 'TO DIFF' },
    { key: 'to_given', label: 'GIVEAWAYS' },
    { key: 'to_taken', label: 'TAKEAWAYS' },
  ],
};

const DEFAULT_SORT: Record<string, string> = {
  passing:  'pass_ypg',
  rushing:  'rush_ypg',
  defense:  'papg',
};

export default function TeamStatsTable({ rows, sortKey, sortDir, onSort, category }: Props) {
  const cols = COL_SETS[category] ?? COL_SETS.default;

  const effectiveSortKey = cols.some(c => c.key === sortKey)
    ? sortKey
    : (DEFAULT_SORT[category] ?? 'ppg');

  const sorted = [...rows].sort((a, b) => {
    const av = a[effectiveSortKey] ?? 0;
    const bv = b[effectiveSortKey] ?? 0;
    const defenseAsc = category === 'defense' && effectiveSortKey === 'papg';
    const dir = defenseAsc ? 'asc' : sortDir;
    return dir === 'desc' ? bv - av : av - bv;
  });

  const SortHdr = ({ k, label }: { k: string; label: string }) => (
    <th
      onClick={() => onSort(k)}
      style={{
        ...thStyle, textAlign: 'right', cursor: 'pointer', userSelect: 'none',
        color: effectiveSortKey === k ? '#FF8740' : T.textDim,
      }}
    >
      {label}{effectiveSortKey === k ? (sortDir === 'desc' ? ' ▼' : ' ▲') : ''}
    </th>
  );

  if (rows.length === 0) {
    return (
      <div style={{ color: T.textMuted, padding: '24px 0', fontSize: 13 }}>
        No team stats yet — simulate some games first.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${T.borderFaint}` }}>
            <th style={{ ...thStyle, textAlign: 'left', width: 32 }}>#</th>
            <th style={{ ...thStyle, textAlign: 'left' }}>TEAM</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>W-L</th>
            {cols.map(c => <SortHdr key={c.key} k={c.key} label={c.label} />)}
          </tr>
        </thead>
        <tbody>
          {sorted.map((t, i) => (
            <tr key={t.id ?? i} style={{ borderBottom: `1px solid ${T.borderFaint}` }}>
              <td style={{ ...tdBase, color: T.textDim }}>{i + 1}</td>
              <td style={{ ...tdBase, color: T.textPrimary, fontWeight: 600 }}>{t.city} {t.name}</td>
              <td style={{ ...tdBase, textAlign: 'right', color: T.textMuted }}>{t.wins}–{t.losses}</td>
              {cols.map(c => {
                const val = t[c.key] ?? 0;
                const isToDiv = c.key === 'to_diff';
                const color = isToDiv
                  ? (val > 0 ? '#4caf50' : val < 0 ? '#e57373' : T.textMuted)
                  : T.textPrimary;
                return (
                  <td key={c.key} style={{ ...tdBase, textAlign: 'right', color, fontWeight: isToDiv ? 600 : 400 }}>
                    {isToDiv && val > 0 ? '+' : ''}{c.key === 'cmp_pct' ? `${val}%` : val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
