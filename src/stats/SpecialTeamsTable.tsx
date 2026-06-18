import React from 'react';
import { T } from '../theme';
import { KickerLeader, SelectedPlayer } from './types';
import { ovrColor, tdBase, thStyle } from './utils';

interface Props {
  kickers: KickerLeader[];
  selectedPlayer: SelectedPlayer | null;
  onSelectPlayer: (p: SelectedPlayer) => void;
  searchQuery: string;
}

export default function SpecialTeamsTable({ kickers, selectedPlayer, onSelectPlayer, searchQuery }: Props) {
  const rowBg = (i: number, playerId: number) =>
    selectedPlayer?.player_id === playerId ? T.bgGreen : i % 2 === 0 ? T.bgCard : 'transparent';

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: T.bgPage }}>
            <th style={{ ...thStyle, textAlign: 'left' }}>#</th>
            <th style={{ ...thStyle, textAlign: 'left' }}>PLAYER</th>
            <th style={thStyle}>TEAM</th>
            <th style={thStyle}>OVR</th>
            <th style={thStyle}>FGM</th>
            <th style={thStyle}>FGA</th>
            <th style={thStyle}>FG%</th>
            <th style={thStyle}>XPM</th>
            <th style={thStyle}>XPA</th>
            <th style={thStyle}>PTS</th>
          </tr>
        </thead>
        <tbody>
          {kickers.length === 0 && (
            <tr>
              <td colSpan={10} style={{ padding: '20px', textAlign: 'center', color: T.textDim, fontSize: 12 }}>
                {searchQuery ? 'No players match your search' : 'No kicker stats yet — simulate some games first'}
              </td>
            </tr>
          )}
          {kickers.map((p, i) => {
            const fgPct = p.fg_att > 0 ? Math.round((p.fg_made / p.fg_att) * 100) : 0;
            const pts = p.fg_made * 3 + p.xp_made;
            return (
              <tr
                key={p.player_id}
                onClick={() => onSelectPlayer(p)}
                style={{ borderBottom: `1px solid ${T.borderFaint}`, background: rowBg(i, p.player_id), cursor: 'pointer' }}
              >
                <td style={{ ...tdBase, textAlign: 'left', color: T.textDim }}>{i + 1}</td>
                <td style={{ ...tdBase, textAlign: 'left', color: T.textPrimary, fontWeight: 600 }}>{p.player_name}</td>
                <td style={{ ...tdBase, color: T.textDim }}>{p.team_name}</td>
                <td style={{ ...tdBase, color: ovrColor(p.overall_rating) }}>{p.overall_rating}</td>
                <td style={{ ...tdBase, color: T.textPrimary }}>{p.fg_made}</td>
                <td style={{ ...tdBase, color: T.textDim }}>{p.fg_att}</td>
                <td style={{ ...tdBase, color: fgPct >= 80 ? '#4caf50' : fgPct >= 65 ? T.textPrimary : '#ef5350' }}>
                  {fgPct}%
                </td>
                <td style={{ ...tdBase, color: T.textPrimary }}>{p.xp_made}</td>
                <td style={{ ...tdBase, color: T.textDim }}>{p.xp_att}</td>
                <td style={{ ...tdBase, color: '#FF8740', fontWeight: 700 }}>{pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
