import React, { useEffect, useState } from 'react';

declare const window: any;

// ─── Types ────────────────────────────────────────────────────────────────────

interface DepthPlayer {
  player_id: number;
  first_name: string;
  last_name: string;
  position: string;
  position_label: string;
  overall_rating: number;
  age: number;
  dev_trait: string;
  speed: number;
  strength: number;
  awareness: number;
  slot: number;
  position_group: string;
}

interface UserTeam {
  id: number;
  city: string;
  name: string;
  abbreviation: string;
}

interface Props {
  userTeam: UserTeam;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const POSITION_GROUPS = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K'];

const GROUP_LABELS: Record<string, string> = {
  QB: 'Quarterback',
  RB: 'Running Back',
  WR: 'Wide Receiver',
  TE: 'Tight End',
  OL: 'Offensive Line',
  DL: 'Defensive Line',
  LB: 'Linebacker',
  CB: 'Cornerback',
  S: 'Safety',
  K: 'Kicker',
};

const TRAIT_META: Record<string, { color: string; short: string }> = {
  Normal:    { color: '#444',    short: '' },
  Star:      { color: '#4FC3F7', short: 'S' },
  Superstar: { color: '#FF8740', short: 'SS' },
  'X-Factor':{ color: '#FFD700', short: 'XF' },
};

function ovrColor(ovr: number): string {
  if (ovr >= 90) return '#FFD700';
  if (ovr >= 80) return '#4FC3F7';
  if (ovr >= 70) return '#81C784';
  return '#aaa';
}

// ─── DepthChart ───────────────────────────────────────────────────────────────

export default function DepthChart({ userTeam }: Props) {
  const [chart,         setChart]         = useState<Record<string, DepthPlayer[]>>({});
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState<string | null>(null);
  const [resetting,     setResetting]     = useState(false);
  const [activeGroup,   setActiveGroup]   = useState('QB');
  const [toast,         setToast]         = useState<string | null>(null);

  useEffect(() => { load(); }, [userTeam.id]);

  const load = async () => {
    setLoading(true);
    const data = await window.api.getDepthChart(userTeam.id);
    setChart(data);
    setLoading(false);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleMoveUp = async (group: string, idx: number) => {
    if (idx === 0) return;
    const players = [...(chart[group] ?? [])];
    [players[idx - 1], players[idx]] = [players[idx], players[idx - 1]];
    const updated = { ...chart, [group]: players };
    setChart(updated);
    setSaving(group);
    await window.api.setDepthChartOrder({
      teamId: userTeam.id,
      positionGroup: group,
      playerIds: players.map(p => p.player_id),
    });
    setSaving(null);
    showToast(`${players[idx - 1].first_name} ${players[idx - 1].last_name} moved to #${idx}`);
  };

  const handleMoveDown = async (group: string, idx: number) => {
    const players = [...(chart[group] ?? [])];
    if (idx >= players.length - 1) return;
    [players[idx], players[idx + 1]] = [players[idx + 1], players[idx]];
    const updated = { ...chart, [group]: players };
    setChart(updated);
    setSaving(group);
    await window.api.setDepthChartOrder({
      teamId: userTeam.id,
      positionGroup: group,
      playerIds: players.map(p => p.player_id),
    });
    setSaving(null);
    showToast(`${players[idx].first_name} ${players[idx].last_name} moved to #${idx + 1}`);
  };

  const handleReset = async () => {
    setResetting(true);
    await window.api.resetDepthChart(userTeam.id);
    await load();
    setResetting(false);
    showToast('Depth chart reset to OVR order');
  };

  const players = chart[activeGroup] ?? [];

  if (loading) {
    return <div style={{ color: '#555', padding: 40, fontFamily: 'monospace' }}>Loading depth chart...</div>;
  }

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'monospace', color: '#ccc', background: '#0d0d0d', minHeight: '100vh' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, background: '#1a2a1a', border: '1px solid #2a4a2a',
          borderRadius: 6, padding: '10px 16px', color: '#4caf50', fontSize: 12, zIndex: 999,
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#fff' }}>Depth Chart</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{userTeam.city} {userTeam.name}</div>
        </div>
        <button
          onClick={handleReset}
          disabled={resetting}
          style={{
            padding: '7px 14px', background: '#141414', border: '1px solid #2a2a2a',
            borderRadius: 4, color: resetting ? '#333' : '#666', fontSize: 11,
            cursor: resetting ? 'not-allowed' : 'pointer', fontFamily: 'monospace',
          }}>
          {resetting ? 'Resetting...' : '↺ Reset to OVR Order'}
        </button>
      </div>

      {/* Position Group Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {POSITION_GROUPS.map(group => {
          const count = (chart[group] ?? []).length;
          if (count === 0) return null;
          return (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              style={{
                padding: '6px 14px',
                background: activeGroup === group ? '#1a2a1a' : '#111',
                border: `1px solid ${activeGroup === group ? '#2a4a2a' : '#1a1a1a'}`,
                borderRadius: 4,
                color: activeGroup === group ? '#4caf50' : '#555',
                fontWeight: activeGroup === group ? 'bold' : 'normal',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'monospace',
              }}>
              {group}
              <span style={{ marginLeft: 5, fontSize: 10, color: activeGroup === group ? '#2a4a2a' : '#333' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Group Label */}
      <div style={{ fontSize: 10, color: '#444', letterSpacing: 2, marginBottom: 16 }}>
        {GROUP_LABELS[activeGroup]?.toUpperCase()} — {players.length} PLAYERS
        {saving === activeGroup && <span style={{ color: '#333', marginLeft: 12 }}>saving...</span>}
      </div>

      {/* Depth Chart List */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        <div>
          {players.length === 0 ? (
            <div style={{ color: '#333', fontSize: 12 }}>No players at this position.</div>
          ) : (
            players.map((player, idx) => {
              const trait = TRAIT_META[player.dev_trait] ?? TRAIT_META['Normal'];
              const isStarter = idx === 0;
              const isBackup  = idx === 1;

              return (
                <div
                  key={player.player_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    marginBottom: 4,
                    background: isStarter ? '#0f1a0f' : '#111',
                    border: `1px solid ${isStarter ? '#1a3a1a' : '#1a1a1a'}`,
                    borderRadius: 6,
                  }}>

                  {/* Slot # */}
                  <div style={{ width: 28, textAlign: 'right', flexShrink: 0 }}>
                    {isStarter ? (
                      <span style={{ fontSize: 9, color: '#4caf50', letterSpacing: 1 }}>STR</span>
                    ) : isBackup ? (
                      <span style={{ fontSize: 9, color: '#555', letterSpacing: 1 }}>BU1</span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#333' }}>{idx + 1}</span>
                    )}
                  </div>

                  {/* OVR */}
                  <div style={{
                    width: 36, textAlign: 'center', fontSize: 14, fontWeight: 'bold',
                    color: ovrColor(player.overall_rating), flexShrink: 0,
                  }}>
                    {player.overall_rating}
                  </div>

                  {/* Name + info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: isStarter ? '#fff' : '#ccc' }}>
                        {player.first_name} {player.last_name}
                      </span>
                      {trait.short && (
                        <span style={{
                          fontSize: 9, color: trait.color, border: `1px solid ${trait.color}`,
                          borderRadius: 2, padding: '1px 4px', letterSpacing: 0.5,
                        }}>
                          {trait.short}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: '#444', marginTop: 2 }}>
                      {player.position_label || player.position} · Age {player.age} · SPD {player.speed} · STR {player.strength} · AWR {player.awareness}
                    </div>
                  </div>

                  {/* Move buttons */}
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button
                      onClick={() => handleMoveUp(activeGroup, idx)}
                      disabled={idx === 0}
                      style={{
                        width: 28, height: 28, background: '#141414',
                        border: '1px solid #222', borderRadius: 3,
                        color: idx === 0 ? '#252525' : '#666',
                        cursor: idx === 0 ? 'not-allowed' : 'pointer',
                        fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                      ▲
                    </button>
                    <button
                      onClick={() => handleMoveDown(activeGroup, idx)}
                      disabled={idx === players.length - 1}
                      style={{
                        width: 28, height: 28, background: '#141414',
                        border: '1px solid #222', borderRadius: 3,
                        color: idx === players.length - 1 ? '#252525' : '#666',
                        cursor: idx === players.length - 1 ? 'not-allowed' : 'pointer',
                        fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                      ▼
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar — starter card */}
        {players.length > 0 && (
          <div>
            <div style={{ fontSize: 10, color: '#444', letterSpacing: 2, marginBottom: 12 }}>STARTER</div>
            <div style={{ background: '#111', border: '1px solid #1a3a1a', borderRadius: 8, padding: '16px 18px' }}>
              <div style={{ fontSize: 9, color: '#4caf50', letterSpacing: 2, marginBottom: 8 }}>
                {GROUP_LABELS[activeGroup]?.toUpperCase()}
              </div>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 }}>
                {players[0].first_name} {players[0].last_name}
              </div>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 16 }}>
                {players[0].position_label || players[0].position} · Age {players[0].age}
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ textAlign: 'center', flex: 1, background: '#0a0a0a', borderRadius: 4, padding: '8px 0' }}>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: ovrColor(players[0].overall_rating) }}>
                    {players[0].overall_rating}
                  </div>
                  <div style={{ fontSize: 9, color: '#333', marginTop: 2 }}>OVR</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1, background: '#0a0a0a', borderRadius: 4, padding: '8px 0' }}>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#ccc' }}>{players[0].speed}</div>
                  <div style={{ fontSize: 9, color: '#333', marginTop: 2 }}>SPD</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1, background: '#0a0a0a', borderRadius: 4, padding: '8px 0' }}>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#ccc' }}>{players[0].strength}</div>
                  <div style={{ fontSize: 9, color: '#333', marginTop: 2 }}>STR</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1, background: '#0a0a0a', borderRadius: 4, padding: '8px 0' }}>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#ccc' }}>{players[0].awareness}</div>
                  <div style={{ fontSize: 9, color: '#333', marginTop: 2 }}>AWR</div>
                </div>
              </div>
              {(() => {
                const trait = TRAIT_META[players[0].dev_trait] ?? TRAIT_META['Normal'];
                return trait.short ? (
                  <div style={{
                    display: 'inline-block', fontSize: 10, color: trait.color,
                    border: `1px solid ${trait.color}`, borderRadius: 3,
                    padding: '2px 8px', letterSpacing: 1,
                  }}>
                    {players[0].dev_trait}
                  </div>
                ) : null;
              })()}

              {players.length > 1 && (
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #1a1a1a' }}>
                  <div style={{ fontSize: 9, color: '#333', letterSpacing: 1, marginBottom: 8 }}>BACKUPS</div>
                  {players.slice(1, 4).map((p, i) => (
                    <div key={p.player_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11, borderBottom: '1px solid #111' }}>
                      <span style={{ color: '#555' }}>{i + 2}. {p.first_name} {p.last_name}</span>
                      <span style={{ color: ovrColor(p.overall_rating) }}>{p.overall_rating}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}