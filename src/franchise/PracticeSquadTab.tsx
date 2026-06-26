import React, { useState } from 'react';
import { PracticePlayer, RosterSpots } from './types';
import { ratingColor, trajectory, fmtSalary } from './utils';

declare const window: any;

const PS_POSITIONS = ['ALL', 'QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K'];

interface Props {
  practiceSquad: PracticePlayer[];
  rosterSpots: RosterSpots | null;
  showToast: (message: string, type: 'success' | 'error') => void;
  loadData: () => Promise<void>;
}

export default function PracticeSquadTab({ practiceSquad, rosterSpots, showToast, loadData }: Props) {
  const [psPos, setPsPos] = useState('ALL');

  const filtered = psPos === 'ALL'
    ? practiceSquad
    : practiceSquad.filter(p => p.position === psPos || p.position_label === psPos);

  return (
    <div style={{ padding: '12px 16px' }}>

      {/* Position filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {PS_POSITIONS.map(pos => (
          <button
            key={pos}
            onClick={() => setPsPos(pos)}
            style={{
              padding: '3px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 4,
              background: psPos === pos ? '#FF8740' : '#141414',
              border: `1px solid ${psPos === pos ? '#FF8740' : '#2a2a2a'}`,
              color: psPos === pos ? '#000' : '#555',
              fontWeight: psPos === pos ? 'bold' : 'normal',
            }}
          >
            {pos}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#444', alignSelf: 'center' }}>
          {filtered.length} / {practiceSquad.length} players
        </span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', gap: 8, padding: '4px 8px', fontSize: 9, letterSpacing: 1, color: '#444' }}>
        <span style={{ flex: 2 }}>PLAYER</span>
        <span style={{ width: 36, textAlign: 'center' }}>POS</span>
        <span style={{ width: 32, textAlign: 'center' }}>AGE</span>
        <span style={{ width: 40, textAlign: 'center' }}>OVR</span>
        <span style={{ width: 70, textAlign: 'right' }}>SALARY</span>
        <span style={{ width: 70 }} />
      </div>

      {filtered.length === 0 ? (
        <div style={{ color: '#444', fontSize: 12, padding: '20px 8px', textAlign: 'center' }}>
          {practiceSquad.length === 0 ? 'No practice squad players' : `No ${psPos} on practice squad`}
        </div>
      ) : filtered.map(p => {
        const traj = trajectory(p.age);
        return (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 8px', borderBottom: '1px solid #1a1a1a',
          }}>
            <div style={{ flex: 2, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: '#ccc', fontWeight: 600 }}>
                {p.first_name} {p.last_name}
              </div>
            </div>
            <span style={{
              width: 36, textAlign: 'center', fontSize: 10, fontWeight: 700,
              color: '#888', background: '#1a1a1a', borderRadius: 3, padding: '1px 4px',
            }}>
              {p.position_label || p.position}
            </span>
            <span style={{ width: 32, textAlign: 'center', fontSize: 12, color: '#666' }}>
              {p.age} <span style={{ fontSize: 9, color: traj.color }}>{traj.label}</span>
            </span>
            <span style={{
              width: 40, textAlign: 'center', fontSize: 15, fontWeight: 800,
              color: ratingColor(p.overall_rating),
            }}>
              {p.overall_rating}
            </span>
            <span style={{ width: 70, textAlign: 'right', fontSize: 11, color: '#555', fontFamily: 'monospace' }}>
              {fmtSalary(p.annual_salary ?? 1.165)}
            </span>
            <div style={{ width: 70, display: 'flex', gap: 4 }}>
              <button
                onClick={async () => {
                  const result = await window.api.promoteFromPs(p.id);
                  if (result.success) {
                    showToast(`${result.name} promoted to active roster.`, 'success');
                    loadData();
                  } else {
                    showToast(result.reason ?? 'Could not promote.', 'error');
                  }
                }}
                disabled={!!(rosterSpots && rosterSpots.activeFree <= 0)}
                style={{
                  flex: 1, padding: '4px 0', fontSize: 11, cursor: 'pointer', borderRadius: 4,
                  background: '#0a1a0a', border: '1px solid #1a4a1a', color: '#4caf50',
                  opacity: rosterSpots && rosterSpots.activeFree <= 0 ? 0.3 : 1,
                }}
              >
                Promote
              </button>
            </div>
          </div>
        );
      })}

      <div style={{ fontSize: 10, color: '#333', padding: '10px 8px', textAlign: 'center' }}>
        {practiceSquad.length} / 16 practice squad slots used
        {rosterSpots && ` · ${rosterSpots.activeFree} active roster spot${rosterSpots.activeFree !== 1 ? 's' : ''} open`}
      </div>
    </div>
  );
}
