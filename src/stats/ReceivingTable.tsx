import React from 'react';
import { T } from '../theme';
import { ReceivingLeader, SelectedPlayer } from './types';
import { ovrColor, tdBase, thStyle } from './utils';

interface Props {
  rows: ReceivingLeader[];
  selectedPlayer: SelectedPlayer | null;
  onSelectPlayer: (p: SelectedPlayer) => void;
  searchQuery: string;
}

export default function ReceivingTable({ rows, selectedPlayer, onSelectPlayer, searchQuery }: Props) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${T.borderFaint}` }}>
            <th style={{ ...thStyle, textAlign: 'left', width: 32 }}>#</th>
            <th style={{ ...thStyle, textAlign: 'left' }}>PLAYER</th>
            <th style={{ ...thStyle, textAlign: 'left' }}>TEAM</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>OVR</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>YDS</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>TD</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>REC</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>TGT</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>YPR</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={9} style={{ ...tdBase, color: T.textMuted, padding: '20px 10px' }}>
              {searchQuery ? 'No players match your search' : 'No receiving stats yet'}
            </td></tr>
          )}
          {rows.map((p, i) => (
            <tr
              key={p.player_id}
              onClick={() => onSelectPlayer(p)}
              style={{
                borderBottom: `1px solid ${T.borderFaint}`,
                background: selectedPlayer?.player_id === p.player_id ? T.bgGreen : i % 2 === 0 ? T.bgCard : 'transparent',
                cursor: 'pointer',
              }}
            >
              <td style={{ ...tdBase, color: T.textDim }}>{i + 1}</td>
              <td style={{ ...tdBase, color: T.textPrimary, fontWeight: 600 }}>{p.player_name}</td>
              <td style={{ ...tdBase, color: T.textMuted }}>{p.team_name}</td>
              <td style={{ ...tdBase, textAlign: 'right', color: ovrColor(p.overall_rating), fontWeight: 700 }}>{p.overall_rating}</td>
              <td style={{ ...tdBase, textAlign: 'right', color: T.textPrimary }}>{p.rec_yards}</td>
              <td style={{ ...tdBase, textAlign: 'right', color: '#4caf50' }}>{p.rec_tds}</td>
              <td style={{ ...tdBase, textAlign: 'right', color: T.textMuted }}>{p.receptions}</td>
              <td style={{ ...tdBase, textAlign: 'right', color: T.textMuted }}>{p.targets}</td>
              <td style={{ ...tdBase, textAlign: 'right', color: T.textMuted }}>
                {p.receptions > 0 ? (p.rec_yards / p.receptions).toFixed(1) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
