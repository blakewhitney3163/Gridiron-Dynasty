import React from 'react';
import { T } from '../theme';
import { DepthPlayer } from './types';
import { TRAIT_META, ovrColor, injuryMeta } from './depthUtils';

interface Props {
  players: DepthPlayer[];
  activeGroup: string;
  saving: string | null;
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
}

export default function DepthChartList({ players, activeGroup, saving, onMoveUp, onMoveDown }: Props) {
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {players.length === 0 ? (
        <div style={{ color: T.textDim, fontSize: 13, padding: '20px 16px' }}>No players at this position.</div>
      ) : (
        players.map((player, idx) => {
          const trait = TRAIT_META[player.dev_trait] ?? TRAIT_META['Normal'];
          const injury = injuryMeta(player.injury_status);
          const isOut = player.injury_status === 'out' || player.injury_status === 'ir';
          const isStarter = idx === 0;
          const isBackup = idx === 1;

          return (
            <div key={player.player_id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderBottom: `1px solid ${T.borderFaint}`,
              opacity: isOut ? 0.6 : 1,
              background: isStarter ? T.bgGreen : 'transparent',
            }}>
              {/* Slot label */}
              <div style={{ width: 36, textAlign: 'center', flexShrink: 0 }}>
                {isStarter ? (
                  <span style={{ color: '#4caf50', fontSize: 9, fontWeight: 700, background: T.bgGreen, padding: '2px 4px', borderRadius: 3 }}>STR</span>
                ) : isBackup ? (
                  <span style={{ color: T.textDim, fontSize: 9, fontWeight: 700 }}>BU1</span>
                ) : (
                  <span style={{ color: T.textDim, fontSize: 11 }}>{idx + 1}</span>
                )}
              </div>

              {/* OVR */}
              <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
                <span style={{ color: ovrColor(player.overall_rating), fontWeight: 700, fontSize: 14 }}>
                  {player.overall_rating}
                </span>
              </div>

              {/* Name + details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: T.textPrimary, fontWeight: 600, fontSize: 13 }}>
                    {player.first_name} {player.last_name}
                  </span>
                  {trait.short && (
                    <span style={{ color: trait.color, fontSize: 9, fontWeight: 700, background: T.bgPanel, padding: '1px 4px', borderRadius: 3 }}>
                      {trait.short}
                    </span>
                  )}
                  {injury && (
                    <span style={{ color: injury.color, fontSize: 9, fontWeight: 700, background: injury.bg, padding: '1px 4px', borderRadius: 3 }}>
                      {injury.label}
                    </span>
                  )}
                </div>
                <div style={{ color: T.textMuted, fontSize: 10, marginTop: 2 }}>
                  {player.position_label || player.position} · Age {player.age} · SPD {player.speed} · STR {player.strength} · AWR {player.awareness}
                  {player.injury_type && player.weeks_out > 0 && (
                    <span style={{ color: '#FF8740', marginLeft: 6 }}>{player.injury_type} · {player.weeks_out}wk</span>
                  )}
                  {player.injury_type && player.weeks_out === 0 && (
                    <span style={{ color: '#FFD700', marginLeft: 6 }}>{player.injury_type} · Game-time</span>
                  )}
                </div>
              </div>

              {/* Move buttons */}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {[
                  { arrow: '▲', disabled: idx === 0, onClick: () => onMoveUp(idx) },
                  { arrow: '▼', disabled: idx === players.length - 1, onClick: () => onMoveDown(idx) },
                ].map(({ arrow, disabled, onClick }) => (
                  <button key={arrow} onClick={onClick} disabled={disabled} style={{
                    width: 28, height: 28, background: T.bgPanel, border: `1px solid ${T.borderFaint}`,
                    borderRadius: 3, color: disabled ? '#252525' : T.textMuted,
                    cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {arrow}
                  </button>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
