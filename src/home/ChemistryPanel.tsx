import React from 'react';
import { T } from '../theme';
import type { ArchetypeCount, ChemistryEvent } from '../preload/chemistry';

interface Props {
  chemistry: number;
  events: ChemistryEvent[];
  archetypes: ArchetypeCount[];
}

function chemColor(c: number): string {
  if (c >= 75) return '#4caf50';
  if (c >= 60) return '#8bc34a';
  if (c >= 40) return '#FF8740';
  if (c >= 25) return '#ef9a9a';
  return '#e57373';
}

function chemLabel(c: number): string {
  if (c >= 90) return 'Electric';
  if (c >= 75) return 'Strong';
  if (c >= 60) return 'Good';
  if (c >= 40) return 'Neutral';
  if (c >= 25) return 'Shaky';
  return 'Toxic';
}

function chemModLabel(c: number): string {
  if (c >= 90) return '+3 sim boost';
  if (c >= 75) return '+2 sim boost';
  if (c >= 60) return '+1 sim boost';
  if (c >= 40) return 'no effect';
  if (c >= 30) return '−2 sim penalty';
  return '−4 sim penalty';
}

const ARCHETYPE_META: Record<string, { label: string; color: string; icon: string }> = {
  team_leader:  { label: 'Team Leader',  color: '#FFD700', icon: '👑' },
  vocal_leader: { label: 'Vocal Leader', color: '#64B5F6', icon: '📣' },
  hard_worker:  { label: 'Hard Worker',  color: '#66BB6A', icon: '💪' },
  coachable:    { label: 'Coachable',    color: '#4DB6AC', icon: '📋' },
  selfish:      { label: 'Selfish',      color: '#FFA726', icon: '⚡' },
  troublemaker: { label: 'Troublemaker', color: '#EF5350', icon: '🔥' },
};

export default function ChemistryPanel({ chemistry, events, archetypes }: Props) {
  const color = chemColor(chemistry);
  const positiveArchetypes = archetypes.filter(a =>
    ['team_leader', 'vocal_leader', 'hard_worker', 'coachable'].includes(a.archetype)
  );
  const negativeArchetypes = archetypes.filter(a =>
    ['selfish', 'troublemaker'].includes(a.archetype)
  );

  return (
    <div style={{ background: T.bgCard, border: `1px solid ${T.borderFaint}`, borderRadius: 6, padding: '14px 16px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ color: T.textMuted, fontFamily: 'monospace', fontSize: 10, letterSpacing: 2 }}>
          🧬 LOCKER ROOM CHEMISTRY
        </div>
        <div style={{ color: T.textDim, fontFamily: 'monospace', fontSize: 9 }}>
          {chemModLabel(chemistry)}
        </div>
      </div>

      {/* Meter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{ flex: 1, height: 8, background: '#0f172a', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${chemistry}%`,
            background: color,
            borderRadius: 4,
            transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold', color, minWidth: 36, textAlign: 'right' }}>
          {chemistry}
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color, minWidth: 48 }}>
          {chemLabel(chemistry)}
        </div>
      </div>

      {/* Archetype Breakdown */}
      {archetypes.length > 0 && (
        <div style={{ marginBottom: 10, borderTop: `1px solid ${T.borderFaint}`, paddingTop: 10 }}>
          <div style={{ color: T.textMuted, fontFamily: 'monospace', fontSize: 9, letterSpacing: 1, marginBottom: 6 }}>
            ROSTER PERSONALITIES
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {[...positiveArchetypes, ...negativeArchetypes].map(a => {
              const meta = ARCHETYPE_META[a.archetype];
              if (!meta) return null;
              return (
                <div
                  key={a.archetype}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 7px',
                    borderRadius: 3,
                    border: `1px solid ${meta.color}44`,
                    background: `${meta.color}18`,
                    fontFamily: 'monospace',
                    fontSize: 9,
                    color: meta.color,
                  }}
                >
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                  <span style={{ opacity: 0.7 }}>×{a.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent events */}
      {events.length > 0 && (
        <div style={{ marginTop: 8, borderTop: `1px solid ${T.borderFaint}`, paddingTop: 8 }}>
          {events.map(ev => (
            <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 10, color: T.textDim, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ev.week > 0 ? `Wk ${ev.week} · ` : 'Offseason · '}{ev.reason.replace(/[()]/g, '')}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 'bold', color: ev.delta > 0 ? '#4caf50' : '#e57373', marginLeft: 8, flexShrink: 0 }}>
                {ev.delta > 0 ? `+${ev.delta}` : ev.delta}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
