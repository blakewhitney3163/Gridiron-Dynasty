import React, { useEffect, useState } from 'react';
import { T } from './theme';
import { DepthPlayer, UserTeam } from './depthChart/types';
import { POSITION_GROUPS, GROUP_LABELS, TRAIT_META } from './depthChart/depthUtils';
import DepthChartList from './depthChart/DepthChartList';
import StarterCard from './depthChart/StarterCard';

declare const window: any;

interface Props {
  userTeam: UserTeam;
}

export default function DepthChart({ userTeam }: Props) {
  const [chart, setChart] = useState<Record<string, DepthPlayer[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [activeGroup, setActiveGroup] = useState('QB');
  const [toast, setToast] = useState<string | null>(null);

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

  const handleMoveUp = async (idx: number) => {
    if (idx === 0) return;
    const players = [...(chart[activeGroup] ?? [])];
    [players[idx - 1], players[idx]] = [players[idx], players[idx - 1]];
    setChart({ ...chart, [activeGroup]: players });
    setSaving(activeGroup);
    await window.api.setDepthChartOrder({ teamId: userTeam.id, positionGroup: activeGroup, playerIds: players.map(p => p.player_id) });
    setSaving(null);
    showToast(`${players[idx - 1].first_name} ${players[idx - 1].last_name} moved to #${idx}`);
  };

  const handleMoveDown = async (idx: number) => {
    const players = [...(chart[activeGroup] ?? [])];
    if (idx >= players.length - 1) return;
    [players[idx], players[idx + 1]] = [players[idx + 1], players[idx]];
    setChart({ ...chart, [activeGroup]: players });
    setSaving(activeGroup);
    await window.api.setDepthChartOrder({ teamId: userTeam.id, positionGroup: activeGroup, playerIds: players.map(p => p.player_id) });
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
  const injuredCount = Object.values(chart).flat().filter(p => p.injury_status !== 'healthy').length;

  if (loading) return (
    <div style={{ color: T.textDim, fontSize: 13, padding: 24 }}>Loading depth chart...</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#222', border: `1px solid ${T.borderFaint}`, color: T.textPrimary,
          padding: '8px 18px', borderRadius: 6, fontSize: 13, zIndex: 999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${T.borderFaint}` }}>
        <div>
          <h2 style={{ color: T.textPrimary, fontSize: 18, fontWeight: 700, margin: '0 0 2px' }}>Depth Chart</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: T.textDim }}>
            {userTeam.city} {userTeam.name}
            {injuredCount > 0 && (
              <span style={{ color: '#FF8740', fontWeight: 700 }}>⚠ {injuredCount} injured</span>
            )}
          </div>
        </div>
        <button onClick={handleReset} disabled={resetting} style={{
          padding: '7px 14px', fontSize: 12, fontWeight: 700, borderRadius: 5, cursor: resetting ? 'not-allowed' : 'pointer',
          background: T.bgPanel, border: `1px solid ${T.borderFaint}`, color: T.textMuted,
        }}>
          {resetting ? 'Resetting...' : '↺ Reset to OVR Order'}
        </button>
      </div>

      {/* Position Group Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '10px 16px', borderBottom: `1px solid ${T.borderFaint}` }}>
        {POSITION_GROUPS.map(group => {
          const groupPlayers = chart[group] ?? [];
          if (groupPlayers.length === 0) return null;
          const hasInjury = groupPlayers.some(p => p.injury_status !== 'healthy');
          return (
            <button key={group} onClick={() => setActiveGroup(group)} style={{
              padding: '6px 14px',
              background: activeGroup === group ? T.bgGreen : T.bgPage,
              border: `1px solid ${activeGroup === group ? '#2a4a2a' : hasInjury ? '#2a1a00' : T.bgCard}`,
              borderRadius: 4,
              color: activeGroup === group ? '#4caf50' : hasInjury ? '#FF8740' : T.textMuted,
              fontWeight: activeGroup === group ? 'bold' : 'normal',
              fontSize: 12, cursor: 'pointer', fontFamily: 'monospace',
            }}>
              {group}{hasInjury && <span style={{ color: '#FF8740', marginLeft: 3 }}>⚠</span>}
            </button>
          );
        })}
      </div>

      {/* Group sub-header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderBottom: `1px solid ${T.borderFaint}` }}>
        <span style={{ color: T.textDim, fontSize: 10, letterSpacing: 1, fontWeight: 700 }}>
          {GROUP_LABELS[activeGroup]?.toUpperCase()} — {players.length} PLAYERS
        </span>
        {saving === activeGroup && (
          <span style={{ color: T.textDim, fontSize: 10 }}>saving...</span>
        )}
      </div>

      {/* Two-panel body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <DepthChartList
          players={players}
          activeGroup={activeGroup}
          saving={saving}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
        />
        <StarterCard players={players} activeGroup={activeGroup} />
      </div>
    </div>
  );
}
