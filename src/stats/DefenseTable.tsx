import React, { useState } from 'react';
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

const POS_COLOR: Record<string, string> = {
  DE: '#FF8740', DT: '#e57373', IDL: '#e57373', LE: '#FF8740', RE: '#FF8740',
  MLB: '#4FC3F7', OLB: '#7986cb', LOLB: '#7986cb', ROLB: '#7986cb',
  CB: '#ba68c8', FS: '#4db6ac', SS: '#81c784',
};

function posColor(pos: string): string {
  return POS_COLOR[pos] ?? '#888';
}

function uniquePositions(rows: { position: string }[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of rows) {
    if (r.position && !seen.has(r.position)) { seen.add(r.position); out.push(r.position); }
  }
  return out.sort();
}

export default function DefenseTable({
  defSubCat, setDefSubCat,
  tackles, sacks, defInterceptions,
  selectedPlayer, onSelectPlayer, searchQuery,
}: Props) {
  const [posFilter, setPosFilter] = useState('ALL');

  const rowBg = (i: number, playerId: number) =>
    selectedPlayer?.player_id === playerId ? T.bgGreen : i % 2 === 0 ? T.bgCard : 'transparent';

  const currentRows: { position: string }[] =
    defSubCat === 'tackles' ? tackles :
    defSubCat === 'sacks' ? sacks : defInterceptions;

  const positions = uniquePositions(currentRows);

  const filterPos = <T extends { position: string }>(rows: T[]): T[] =>
    posFilter === 'ALL' ? rows : rows.filter(r => r.position === posFilter);

  const filteredTackles = filterPos(tackles);
  const filteredSacks = filterPos(sacks);
  const filteredInts = filterPos(defInterceptions);

  return (
    <div>
      {/* Sub-category tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {subCats.map(sub => (
          <button key={sub.id} onClick={() => { setDefSubCat(sub.id); setPosFilter('ALL'); }} style={{
            padding: '5px 14px', fontSize: 11,
            background: defSubCat === sub.id ? T.bgBlue : T.bgPage,
            color: defSubCat === sub.id ? '#4FC3F7' : T.textDim,
            border: `1px solid ${defSubCat === sub.id ? '#2a2a4a' : T.bgCard}`,
            borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace',
          }}>{sub.label}</button>
        ))}
      </div>

      {/* Position filter buttons */}
      {positions.length > 1 && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
          <button
            onClick={() => setPosFilter('ALL')}
            style={{
              padding: '3px 9px', fontSize: 11, cursor: 'pointer', borderRadius: 3,
              background: posFilter === 'ALL' ? '#FF8740' : '#141414',
              border: `1px solid ${posFilter === 'ALL' ? '#FF8740' : '#222'}`,
              color: posFilter === 'ALL' ? '#000' : '#555',
              fontWeight: posFilter === 'ALL' ? 'bold' : 'normal',
            }}>ALL</button>
          {positions.map(pos => (
            <button key={pos} onClick={() => setPosFilter(pos)} style={{
              padding: '3px 9px', fontSize: 11, cursor: 'pointer', borderRadius: 3,
              background: posFilter === pos ? posColor(pos) : '#141414',
              border: `1px solid ${posFilter === pos ? posColor(pos) : '#222'}`,
              color: posFilter === pos ? '#000' : posColor(pos),
              fontWeight: posFilter === pos ? 'bold' : 'normal',
            }}>{pos}</button>
          ))}
        </div>
      )}

      {defSubCat === 'tackles' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.borderFaint}` }}>
                <th style={{ ...thStyle, textAlign: 'left', width: 32 }}>#</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>PLAYER</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>TEAM</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>POS</th>
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
              {filteredTackles.length === 0 && (
                <tr><td colSpan={11} style={{ ...tdBase, color: T.textMuted, padding: '20px 10px' }}>
                  {searchQuery || posFilter !== 'ALL' ? 'No players match your filter' : 'No defensive stats yet — simulate some games first'}
                </td></tr>
              )}
              {filteredTackles.map((p, i) => (
                <tr
                  key={p.player_id}
                  onClick={() => onSelectPlayer(p)}
                  style={{ borderBottom: `1px solid ${T.borderFaint}`, background: rowBg(i, p.player_id), cursor: 'pointer' }}
                >
                  <td style={{ ...tdBase, color: T.textDim }}>{i + 1}</td>
                  <td style={{ ...tdBase, color: T.textPrimary, fontWeight: 600 }}>{p.player_name}</td>
                  <td style={{ ...tdBase, color: T.textMuted }}>{p.team_name}</td>
                  <td style={{ ...tdBase, textAlign: 'center' }}>
                    <span style={{ color: posColor(p.position), fontSize: 11, fontWeight: 700 }}>{p.position}</span>
                  </td>
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
                <th style={{ ...thStyle, textAlign: 'center' }}>POS</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>OVR</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>SACKS</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>TFL</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>FF</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>SOLO TKL</th>
              </tr>
            </thead>
            <tbody>
              {filteredSacks.length === 0 && (
                <tr><td colSpan={9} style={{ ...tdBase, color: T.textMuted, padding: '20px 10px' }}>
                  {searchQuery || posFilter !== 'ALL' ? 'No players match your filter' : 'No sack data yet'}
                </td></tr>
              )}
              {filteredSacks.map((p, i) => (
                <tr
                  key={p.player_id}
                  onClick={() => onSelectPlayer(p)}
                  style={{ borderBottom: `1px solid ${T.borderFaint}`, background: rowBg(i, p.player_id), cursor: 'pointer' }}
                >
                  <td style={{ ...tdBase, color: T.textDim }}>{i + 1}</td>
                  <td style={{ ...tdBase, color: T.textPrimary, fontWeight: 600 }}>{p.player_name}</td>
                  <td style={{ ...tdBase, color: T.textMuted }}>{p.team_name}</td>
                  <td style={{ ...tdBase, textAlign: 'center' }}>
                    <span style={{ color: posColor(p.position), fontSize: 11, fontWeight: 700 }}>{p.position}</span>
                  </td>
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
                <th style={{ ...thStyle, textAlign: 'center' }}>POS</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>OVR</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>INT</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>PD</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>DEF TD</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>TACKLES</th>
              </tr>
            </thead>
            <tbody>
              {filteredInts.length === 0 && (
                <tr><td colSpan={9} style={{ ...tdBase, color: T.textMuted, padding: '20px 10px' }}>
                  {searchQuery || posFilter !== 'ALL' ? 'No players match your filter' : 'No INT/PD data yet'}
                </td></tr>
              )}
              {filteredInts.map((p, i) => (
                <tr
                  key={p.player_id}
                  onClick={() => onSelectPlayer(p)}
                  style={{ borderBottom: `1px solid ${T.borderFaint}`, background: rowBg(i, p.player_id), cursor: 'pointer' }}
                >
                  <td style={{ ...tdBase, color: T.textDim }}>{i + 1}</td>
                  <td style={{ ...tdBase, color: T.textPrimary, fontWeight: 600 }}>{p.player_name}</td>
                  <td style={{ ...tdBase, color: T.textMuted }}>{p.team_name}</td>
                  <td style={{ ...tdBase, textAlign: 'center' }}>
                    <span style={{ color: posColor(p.position), fontSize: 11, fontWeight: 700 }}>{p.position}</span>
                  </td>
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
