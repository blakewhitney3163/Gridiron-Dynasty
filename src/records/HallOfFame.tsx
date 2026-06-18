import React from 'react';
import { HofEntry } from './types';
import { TRAIT_META, hofKeyStat } from './recordsUtils';

interface Props {
  hofData: HofEntry[];
}

export default function HallOfFame({ hofData }: Props) {
  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 22 }}>🏛</span>
        <span style={{ color: '#FFD700', fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>HALL OF FAME</span>
      </div>
      <p style={{ color: '#666', fontSize: 12, margin: '0 0 20px' }}>
        Players who reached career milestones before retiring — inducted on the season they retired.
      </p>

      {hofData.length === 0 ? (
        <div style={{ color: '#555', fontSize: 13, padding: '24px 0' }}>
          No inductees yet — keep simulating seasons.
        </div>
      ) : (
        Array.from(new Set(hofData.map(e => e.inducted_season))).sort((a, b) => b - a).map(season => (
          <div key={season} style={{ marginBottom: 24 }}>
            <div style={{ color: '#FFD700', fontSize: 10, letterSpacing: 2, fontWeight: 700, marginBottom: 10 }}>
              {season} INDUCTEES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {hofData.filter(e => e.inducted_season === season).map(entry => {
                const trait = TRAIT_META[entry.dev_trait] ?? TRAIT_META['Normal'];
                return (
                  <div key={entry.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: '#1a1a1a', border: '1px solid #2a2a2a',
                    borderRadius: 6, padding: '10px 14px',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{entry.name}</span>
                        {trait.short && (
                          <span style={{ color: trait.color, fontSize: 9, fontWeight: 700, background: '#111', padding: '1px 4px', borderRadius: 3 }}>
                            {trait.short}
                          </span>
                        )}
                      </div>
                      <div style={{ color: '#666', fontSize: 11, marginTop: 2 }}>
                        {entry.position} · Peak {entry.peak_ovr} OVR · {entry.career_games} career games
                      </div>
                      <div style={{ color: '#FFD700', fontSize: 11, marginTop: 2 }}>{hofKeyStat(entry)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
