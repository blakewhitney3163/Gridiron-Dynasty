import React from 'react';
import { T } from '../theme';
import { TacklesLeader, SacksLeader, DefIntLeader, SelectedPlayer, DefSubCat } from './types';
import { ovrColor, tdBase, thStyle } from './utils';

interface Props {
  defSubCat: DefSubCat;
  setDefSubCat: (s: DefSubCat) => void;
  tackles: TacklesLeader[];
  sacks: SacksLeader[];
  defInterceptions: DefIntLeader[];
  selectedPlayer: SelectedPlayer | null;
  onSelectPlayer: (p: SelectedPlayer) => void;
  searchQuery: string;
}

const subCats: { id: DefSubCat; label: string }[] = [
  { id: 'tackles',       label: 'Tackles' },
  { id: 'sacks',         label: 'Sacks' },
  { id: 'interceptions', label: 'INTs / PDs' },
];

export default function DefenseTable({
  defSubCat, setDefSubCat,
  tackles, sacks, defInterceptions,
  selectedPlayer, onSelectPlayer, searchQuery,
}: Props) {
  const rowBg = (i: number, playerId: number) =>
    selectedPlayer?.player_id === playerId ? T.bgGreen : i % 2 === 0 ? T.bgCard : 'transparent';

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {subCats.map(sub => (
          <button key={sub.id} onClick={() => setDefSubCat(sub.id)} style={{
            padding: '5px 14px', fontSize: 11,
            background: defSubCat === sub.id ? T.bgBlue : T.bgPage,
            color: defSubCat === sub.id ? '#4FC3F7' : T.textDim,
            border: `1px solid ${defSubCat === sub.id ? '#2a2a4a' : T.bgCard}`,
            borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace',
          }}>{sub.label}</button>
        ))}
      </div>

      {defSubCat === 'tackles' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.borderFaint}` }}>
                <th style={{ ...thStyle, textAlign: 'left', width: 32 }}>#</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>PLAYER</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>TEAM</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>OVR</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>SOLO</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>AST</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>TOT</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>SACKS</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>TFL</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>FF</th>
              </tr>
            </thead>
            <tbody>
              {tackles.length === 0 && (
                <tr><td colSpan={10} style={{ ...tdBase, color: T.textMuted, padding: '20px 10px' }}>
                  {searchQuery ? 'No players match your search' : 'No defensive stats yet — simulate some games first'}
                </td></tr>
              )}
              {tackles.map((p, i) => (
                <tr
                  key={p.player_id}
                  onClick={() => onSelectPlayer(p)}
                  style={{ borderBottom: `1px solid ${T.borderFaint}`, background: rowBg(i, p.player_id), cursor: 'pointer' }}
                >
                  <td style={{ ...tdBase, color: T.textDim }}>{i + 1}</td>
                  <td style={{ ...tdBase, color: T.textPrimary, fontWeight: 600 }}>{p.player_name}</td>
                  <td style={{ ...tdBase, color: T.textMuted }}>{p.team_name}</td>
                  <td style={{ ...tdBase, textAlign: 'right', color: ovrColor(p.overall_rating), fontWeight: 700 }}>{p.overall_rating}</td>
                  <td style={{ ...tdBase, textAlign: 'right', color: T.textPrimary }}>{p.tackles}</td>
                  <td style={{ ...tdBase, textAlign: 'right', color: T.textMuted }}>{p.assisted_tackles}</td>
                  <td style={{ ...tdBase, textAlign: 'right', color: T.textPrimary, fontWeight: 600 }}>{(p.tackles ?? 0) + (p.assisted_tackles ?? 0)}</td>
                  <td style={{ ...tdBase, textAlign: 'right', color: '#FF8740' }}>{Number(p.sacks ?? 0).toFixed(1)}</td>
                  <td style={{ ...tdBase, textAlign: 'right', color: T.textMuted }}>{p.tfl}</td>
                  <td style={{ ...tdBase, textAlign: 'right', color: T.textMuted }}>{p.forced_fumbles}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {defSubCat === 'sacks' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.borderFaint}` }}>
                <th style={{ ...thStyle, textAlign: 'left', width: 32 }}>#</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>PLAYER</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>TEAM</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>OVR</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>SACKS</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>TFL</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>FF</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>SOLO TKL</th>
              </tr>
            </thead>
            <tbody>
              {sacks.length === 0 && (
                <tr><td colSpan={8} style={{ ...tdBase, color: T.textMuted, padding: '20px 10px' }}>
                  {searchQuery ? 'No players match your search' : 'No sack data yet'}
                </td></tr>
              )}
              {sacks.map((p, i) => (
                <tr
                  key={p.player_id}
                  onClick={() => onSelectPlayer(p)}
                  style={{ borderBottom: `1px solid ${T.borderFaint}`, background: rowBg(i, p.player_id), cursor: 'pointer' }}
                >
                  <td style={{ ...tdBase, color: T.textDim }}>{i + 1}</td>
                  <td style={{ ...tdBase, color: T.textPrimary, fontWeight: 600 }}>{p.player_name}</td>
                  <td style={{ ...tdBase, color: T.textMuted }}>{p.team_name}</td>
                  <td style={{ ...tdBase, textAlign: 'right', color: ovrColor(p.overall_rating), fontWeight: 700 }}>{p.overall_rating}</td>
                  <td style={{ ...tdBase, textAlign: 'right', color: '#FF8740', fontWeight: 700 }}>{Number(p.sacks ?? 0).toFixed(1)}</td>
                  <td style={{ ...tdBase, textAlign: 'right', color: T.textMuted }}>{p.tfl}</td>
                  <td style={{ ...tdBase, textAlign: 'right', color: T.textMuted }}>{p.forced_fumbles}</td>
                  <td style={{ ...tdBase, textAlign: 'right', color: T.textMuted }}>{p.tackles}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {defSubCat === 'interceptions' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.borderFaint}` }}>
                <th style={{ ...thStyle, textAlign: 'left', width: 32 }}>#</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>PLAYER</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>TEAM</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>OVR</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>INT</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>PD</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>DEF TD</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>TACKLES</th>
              </tr>
            </thead>
            <tbody>
              {defInterceptions.length === 0 && (
                <tr><td colSpan={8} style={{ ...tdBase, color: T.textMuted, padding: '20px 10px' }}>
                  {searchQuery ? 'No players match your search' : 'No INT/PD data yet'}
                </td></tr>
              )}
              {defInterceptions.map((p, i) => (
                <tr
                  key={p.player_id}
                  onClick={() => onSelectPlayer(p)}
                  style={{ borderBottom: `1px solid ${T.borderFaint}`, background: rowBg(i, p.player_id), cursor: 'pointer' }}
                >
                  <td style={{ ...tdBase, color: T.textDim }}>{i + 1}</td>
                  <td style={{ ...tdBase, color: T.textPrimary, fontWeight: 600 }}>{p.player_name}</td>
                  <td style={{ ...tdBase, color: T.textMuted }}>{p.team_name}</td>
                  <td style={{ ...tdBase, textAlign: 'right', color: ovrColor(p.overall_rating), fontWeight: 700 }}>{p.overall_rating}</td>
                  <td style={{ ...tdBase, textAlign: 'right', color: '#4FC3F7', fontWeight: 700 }}>{p.def_interceptions}</td>
                  <td style={{ ...tdBase, textAlign: 'right', color: T.textMuted }}>{p.pass_deflections}</td>
                  <td style={{ ...tdBase, textAlign: 'right', color: '#4caf50' }}>{p.def_tds}</td>
                  <td style={{ ...tdBase, textAlign: 'right', color: T.textMuted }}>{p.tackles}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
