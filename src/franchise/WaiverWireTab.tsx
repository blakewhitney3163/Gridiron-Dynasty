import React from 'react';
import { WaiverPlayer, RosterSpots } from './types';
import { TRAIT_META, ratingColor, trajectory } from './utils';

declare const window: any;

interface Props {
  waiverWire: WaiverPlayer[];
  rosterSpots: RosterSpots | null;
  showToast: (message: string, type: 'success' | 'error') => void;
  loadData: () => Promise<void>;
  reloadWaivers: () => Promise<void>;
}

export default function WaiverWireTab({ waiverWire, rosterSpots, showToast, loadData, reloadWaivers }: Props) {
  const [claiming, setClaiming] = React.useState<number | null>(null);

  const handleClaim = async (player: WaiverPlayer) => {
    if (claiming) return;
    if (rosterSpots && rosterSpots.activeFree <= 0) {
      showToast('Active roster is full. Release a player first.', 'error');
      return;
    }
    setClaiming(player.id);
    const result = await window.api.claimWaiver(player.id);
    if (result.success) {
      showToast(`${result.name} claimed off waivers!`, 'success');
      await loadData();
      await reloadWaivers();
    } else {
      showToast(result.reason ?? 'Could not claim player.', 'error');
    }
    setClaiming(null);
  };

  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 70px 55px 90px 100px 80px',
        gap: 8, padding: '4px 12px', marginBottom: 4,
        borderBottom: '1px solid #1a1a1a',
        color: '#333', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase',
      }}>
        {['PLAYER', 'AGE', 'OVR', 'DEV', 'SPD / STR / AWR', ''].map((h, i) => (
          <div key={i}>{h}</div>
        ))}
      </div>

      {waiverWire.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#333', padding: '48px 0', fontSize: 13 }}>
          No players currently on waivers
        </div>
      ) : (
        waiverWire.map(p => {
          const trait = TRAIT_META[p.dev_trait] ?? TRAIT_META['Normal'];
          const traj = trajectory(p.age);
          const isClaiming = claiming === p.id;
          const canClaim = p.canClaim && !!rosterSpots && rosterSpots.activeFree > 0;

          return (
            <div key={p.id} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 70px 55px 90px 100px 80px',
              gap: 8, padding: '7px 12px',
              borderBottom: '1px solid #111',
              alignItems: 'center',
            }}>
              <div>
                <span style={{ color: '#ddd', fontWeight: 600, fontSize: 13 }}>
                  {p.first_name} {p.last_name}
                </span>
                {trait.short && (
                  <span style={{
                    marginLeft: 6, fontSize: 9, padding: '1px 4px',
                    background: trait.bg, color: trait.color, borderRadius: 3,
                  }}>{trait.short}</span>
                )}
                <div style={{ color: '#444', fontSize: 10, marginTop: 1 }}>
                  {p.position_label || p.position}
                </div>
              </div>

              <div style={{ color: '#888', fontSize: 12 }}>
                {p.age} <span style={{ color: traj.color, fontSize: 10 }}>{traj.label}</span>
              </div>

              <div style={{ color: ratingColor(p.overall_rating), fontWeight: 700, fontSize: 14 }}>
                {p.overall_rating}
              </div>

              <div style={{ color: trait.color, fontSize: 11 }}>
                {p.dev_trait === 'Normal' ? '—' : p.dev_trait}
              </div>

              <div style={{ color: '#555', fontSize: 11 }}>
                {p.speed} / {p.strength} / {p.awareness}
              </div>

              <div>
                {!p.canClaim ? (
                  <span style={{ color: '#333', fontSize: 10, fontStyle: 'italic' }}>Your cut</span>
                ) : (
                  <button
                    onClick={() => handleClaim(p)}
                    disabled={!!claiming || !canClaim}
                    style={{
                      padding: '4px 10px', fontSize: 11,
                      cursor: canClaim && !claiming ? 'pointer' : 'not-allowed',
                      borderRadius: 4,
                      background: isClaiming ? '#0a1a0a' : '#141414',
                      border: `1px solid ${canClaim ? '#4caf50' : '#1a2a1a'}`,
                      color: canClaim ? '#4caf50' : '#2a3a2a',
                    }}
                  >
                    {isClaiming ? '...' : 'Claim'}
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}

      <div style={{ padding: '8px 12px', color: '#333', fontSize: 10, borderTop: '1px solid #111', marginTop: 4 }}>
        {waiverWire.length} player{waiverWire.length !== 1 ? 's' : ''} on waivers ·
        Unclaimed players clear to free agency after 1 week ·
        Claim priority: worst record first
      </div>
    </div>
  );
}
