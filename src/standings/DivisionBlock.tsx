import React from 'react';
import { T } from '../theme';
import { Team } from './types';
import { pct, gb } from './standingsUtils';

interface Props {
  conf: string;
  division: string;
  teams: Team[];
  userTeamId?: number;
  playoffIds: Set<number>;
}

const thStyle: React.CSSProperties = {
  padding: '4px 8px', fontSize: 9, color: T.textDim,
  letterSpacing: 1, fontWeight: 700, textAlign: 'right',
};
const tdStyle: React.CSSProperties = {
  padding: '6px 8px', fontSize: 12, color: T.textMuted,
  textAlign: 'right', borderTop: `1px solid ${T.borderFaint}`,
};

export default function DivisionBlock({ conf, division, teams, userTeamId, playoffIds }: Props) {
  const sorted = [...teams].sort((a, b) => b.wins - a.wins || a.losses - b.losses);
  const leader = sorted[0];

  return (
    <div style={{ marginBottom: 16, background: T.bgCard, border: `1px solid ${T.borderFaint}`, borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', background: T.bgPanel, borderBottom: `1px solid ${T.borderFaint}` }}>
        <span style={{ color: T.textDim, fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>
          {conf.toUpperCase()} {division.toUpperCase()}
        </span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, textAlign: 'left', paddingLeft: 10 }}>TEAM</th>
            <th style={thStyle}>W</th>
            <th style={thStyle}>L</th>
            <th style={thStyle}>PCT</th>
            <th style={thStyle}>GB</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((team, i) => {
            const isUser = team.id === userTeamId;
            const inPlayoffs = playoffIds.has(team.id);
            const isLeader = i === 0;
            return (
              <tr key={team.id} style={{ background: isUser ? T.bgBlue : 'transparent' }}>
                <td style={{ ...tdStyle, textAlign: 'left', paddingLeft: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {inPlayoffs && (
                      <span style={{
                        fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 2,
                        background: isLeader ? '#2a1800' : '#0a1a2a',
                        color: isLeader ? '#FF8740' : '#4FC3F7',
                      }}>
                        {isLeader ? 'DIV' : 'WC'}
                      </span>
                    )}
                    <span style={{ color: isUser ? '#4FC3F7' : T.textPrimary, fontWeight: isUser ? 700 : 400 }}>
                      {team.city} {team.name}
                    </span>
                    {isUser && <span style={{ color: '#4FC3F7', fontSize: 10 }}>◆</span>}
                  </div>
                </td>
                <td style={tdStyle}>{team.wins}</td>
                <td style={tdStyle}>{team.losses}</td>
                <td style={tdStyle}>{pct(team.wins, team.losses)}</td>
                <td style={tdStyle}>{leader ? gb(leader.wins, leader.losses, team.wins, team.losses) : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
