import React from 'react';
import { T } from '../theme';
import { DepthPlayer } from './types';
import { GROUP_LABELS, TRAIT_META, ovrColor, injuryMeta } from './depthUtils';

interface Props {
  players: DepthPlayer[];
  activeGroup: string;
}

export default function StarterCard({ players, activeGroup }: Props) {
  if (players.length === 0) return null;

  const starter = players[0];
  const trait = TRAIT_META[starter.dev_trait] ?? TRAIT_META['Normal'];
  const injury = injuryMeta(starter.injury_status);
  const isOut = starter.injury_status === 'out' || starter.injury_status === 'ir';
  const effective = isOut
    ? players.find(p => p.injury_status === 'healthy' || p.injury_status === 'questionable')
    : starter;

  const display = (isOut && effective) ? effective : starter;
  const displayTrait = TRAIT_META[display.dev_trait] ?? TRAIT_META['Normal'];
  const displayInjury = injuryMeta(display.injury_status);

  const attrs = [
    { label: 'OVR', val: display.overall_rating, color: ovrColor(display.overall_rating) },
    { label: 'SPD', val: display.speed,           color: T.textPrimary },
    { label: 'STR', val: display.strength,         color: T.textPrimary },
    { label: 'AWR', val: display.awareness,        color: T.textPrimary },
  ];

  return (
    <div style={{
      width: 260, flexShrink: 0, borderLeft: `1px solid ${T.borderFaint}`,
      padding: '16px', overflowY: 'auto', background: T.bgPanel,
    }}>
      <div style={{ color: T.textDim, fontSize: 9, letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>
        {isOut ? 'EXPECTED STARTER' : 'STARTER'}
      </div>

      {isOut && effective && (
        <div style={{ color: '#FF8740', fontSize: 11, marginBottom: 10, lineHeight: 1.4 }}>
          ⚠ {starter.first_name} {starter.last_name} is {starter.injury_status.toUpperCase()} — {effective.first_name} {effective.last_name} starts
        </div>
      )}

      <div style={{ color: T.textDim, fontSize: 10, letterSpacing: 1, marginBottom: 8 }}>
        {GROUP_LABELS[activeGroup]?.toUpperCase()}
      </div>

      <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 20, marginBottom: 4 }}>
        {display.first_name} {display.last_name}
      </div>
      <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 12 }}>
        {display.position_label || display.position} · Age {display.age}
        {displayInjury && (
          <span style={{ color: displayInjury.color, fontWeight: 700, marginLeft: 8 }}>
            {displayInjury.label}{display.weeks_out > 0 ? ` · ${display.weeks_out}wk` : ''}
          </span>
        )}
      </div>

      {/* Attribute grid */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        {attrs.map(({ label, val, color }) => (
          <div key={label} style={{ textAlign: 'center', minWidth: 40 }}>
            <div style={{ color, fontWeight: 700, fontSize: 18 }}>{val}</div>
            <div style={{ color: T.textDim, fontSize: 9, letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      {displayTrait.short && (
        <div style={{
          display: 'inline-block', color: displayTrait.color, fontSize: 11, fontWeight: 700,
          background: T.bgCard, padding: '3px 10px', borderRadius: 4, marginBottom: 14,
        }}>
          {display.dev_trait}
        </div>
      )}

      {/* Depth list */}
      {players.length > 1 && (
        <div>
          <div style={{ color: T.textDim, fontSize: 9, letterSpacing: 1, marginBottom: 8 }}>DEPTH</div>
          {players.slice(1, 5).map((p, i) => {
            const pInjury = injuryMeta(p.injury_status);
            return (
              <div key={p.player_id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '5px 0', borderBottom: `1px solid ${T.borderFaint}`,
              }}>
                <span style={{ color: T.textMuted, fontSize: 12 }}>
                  {i + 2}. {p.first_name[0]}. {p.last_name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {pInjury && (
                    <span style={{ color: pInjury.color, fontSize: 9, fontWeight: 700 }}>{pInjury.label}</span>
                  )}
                  <span style={{ color: ovrColor(p.overall_rating), fontWeight: 700, fontSize: 13 }}>
                    {p.overall_rating}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
