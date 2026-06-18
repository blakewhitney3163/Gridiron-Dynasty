import React from 'react';
import { T } from '../theme';
import { Team } from './types';

interface Props {
  teams: Team[];
  selectedTeamId: number | null;
  onSelect: (id: number) => void;
}

export default function TeamSelector({ teams, selectedTeamId, onSelect }: Props) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ color: T.textDim, fontSize: 10, letterSpacing: 1, marginBottom: 8 }}>SELECT TEAM TO TRADE WITH</div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {teams.map(t => (
          <button key={t.id} onClick={() => onSelect(t.id)} style={{
            padding: '5px 12px',
            background: selectedTeamId === t.id ? '#FF8740' : T.bgCard,
            color: selectedTeamId === t.id ? '#000' : T.textMuted,
            border: `1px solid ${selectedTeamId === t.id ? '#FF8740' : T.borderFaint}`,
            borderRadius: 4, fontSize: 11, cursor: 'pointer',
            fontWeight: selectedTeamId === t.id ? 700 : 400,
          }}>
            {t.city} {t.name}
          </button>
        ))}
      </div>
    </div>
  );
}
