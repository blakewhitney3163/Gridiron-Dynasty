import React from 'react';
import { PracticePlayer, RosterSpots } from './types';
import { TRAIT_META, ratingColor, trajectory, fmtSalary } from './utils';

declare const window: any;

interface Props {
  practiceSquad: PracticePlayer[];
  rosterSpots: RosterSpots | null;
  showToast: (message: string, type: 'success' | 'error') => void;
  loadData: () => Promise<void>;
}

export default function PracticeSquadTab({ practiceSquad, rosterSpots, showToast, loadData }: Props) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px auto', gap: 8, padding: '6px 12px', fontSize: 10, color: '#333', letterSpacing: 1, borderBottom: '1px solid #1a1a1a', marginBottom: 4 }}>
        <span>PLAYER</span><span>AGE / OVR</span><span>DEV</span><span>SALARY</span>
      </div>

      {practiceSquad.length === 0 ? (
        <div style={{ color: '#333', padding: '20px 12px', fontSize: 13 }}>No practice squad players</div>
      ) : practiceSquad.map(p => {
        const trait = TRAIT_META[p.dev_trait] ?? TRAIT_META['Normal'];
        const traj = trajectory(p.age);
        return (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid #0d0d0d' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#ddd', fontWeight: 600, fontSize: 13 }}>{p.first_name} {p.last_name}</span>
                {trait.short && <span style={{ background: trait.color, color: '#000', fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 3 }}>{trait.short}</span>}
              </div>
              <span style={{ color: '#444', fontSize: 11 }}>{p.position_label || p.position}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 60 }}>
              <span style={{ color: traj.color, fontSize: 12 }}>{p.age} {traj.label}</span>
              <span style={{ color: ratingColor(p.overall_rating), fontWeight: 700, fontSize: 14 }}>{p.overall_rating}</span>
            </div>
            <div style={{ width: 70, color: trait.color, fontSize: 11, textAlign: 'center', fontWeight: p.dev_trait !== 'Normal' ? 700 : 'normal' }}>
              {p.dev_trait === 'Normal' ? '—' : p.dev_trait}
            </div>
            <div style={{ width: 80, color: '#888', fontSize: 12 }}>{fmtSalary(p.annual_salary ?? 1.165)}</div>
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
                padding: '4px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 4,
                background: '#0a1a0a', border: '1px solid #1a4a1a', color: '#4caf50',
                opacity: rosterSpots && rosterSpots.activeFree <= 0 ? 0.3 : 1,
              }}>
              Promote
            </button>
          </div>
        );
      })}

      <div style={{ color: '#333', fontSize: 11, padding: '10px 12px' }}>
        {practiceSquad.length} / 16 practice squad slots used
      </div>
    </div>
  );
}
