import React from 'react';
import { T } from '../theme';
import { Team, TeamStatus } from './types';
import { STATUS_META } from './tradeUtils';

interface Props {
  selectedTeam: Team | undefined;
  teamStatus: TeamStatus;
  savingOverride: boolean;
  onSetOverride: (value: string) => void;
}

export default function TeamStatusBanner({ selectedTeam, teamStatus, savingOverride, onSetOverride }: Props) {
  const meta = STATUS_META[teamStatus.status] ?? STATUS_META['Neutral'];

  return (
    <div style={{
      background: T.bgCard, border: `1px solid ${T.borderFaint}`,
      borderRadius: 8, padding: '12px 14px', marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 14 }}>
            {selectedTeam?.city} {selectedTeam?.name}
          </div>
          <div style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>{teamStatus.description}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            color: meta.color, background: meta.bg,
            padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
          }}>{teamStatus.status.toUpperCase()}</span>
          {teamStatus.isOverridden && (
            <span style={{ color: T.textDim, fontSize: 9, background: T.bgPanel, padding: '1px 5px', borderRadius: 3 }}>MANUAL</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ color: T.textMuted, fontSize: 11 }}>{teamStatus.wins}–{teamStatus.losses}</span>
        <span style={{ color: T.textMuted, fontSize: 11 }}>Avg OVR: {teamStatus.avgOverall}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <span style={{ color: T.textDim, fontSize: 10, letterSpacing: 1 }}>OVERRIDE</span>
          <select
            defaultValue="auto"
            onChange={e => onSetOverride(e.target.value)}
            style={{
              fontSize: 11, background: T.bgInput, color: T.textPrimary,
              border: `1px solid ${T.borderFaint}`, borderRadius: 4,
              padding: '3px 6px', cursor: savingOverride ? 'wait' : 'pointer',
              opacity: savingOverride ? 0.5 : 1,
            }}
          >
            <option value="auto">⚙ Auto-detect</option>
            <option value="Contender">🏆 Contender</option>
            <option value="Buyer">📈 Buyer</option>
            <option value="Neutral">➖ Neutral</option>
            <option value="Seller">📉 Seller</option>
            <option value="Rebuilding">🔄 Rebuilding</option>
          </select>
        </div>
      </div>
    </div>
  );
}
