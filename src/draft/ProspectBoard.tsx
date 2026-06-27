import React from 'react';
import { T } from '../theme';
import { Prospect, MyPick, CpuPick, PickSlot, DraftTeam } from './types';
import { POSITIONS, TRAIT_META, ovrColor, gradeColor, fortyColor, benchColor, vertColor, coneColor } from './draftUtils';

interface Props {
  available: Prospect[];
  posFilter: string;
  setPosFilter: (p: string) => void;
  showResults: boolean;
  userPickSlots: number[];
  currentPickIdx: number;
  currentRound: number;
  pickNum: number | undefined;
  totalPicksThisRound: number;
  myPicks: MyPick[];
  lastCpuPicks: CpuPick[];
  roundPickSlots: PickSlot[];
  draftOrder: DraftTeam[];
  scoutsLeft: number;
  scouting: number | null;
  running: boolean;
  userTeam: { id: number; city: string; name: string };
  onPick: (p: Prospect) => void;
  onAutoPick: () => void;
  onScout: (id: number) => void;
  onNextRound: () => void;
  currentSeason: number;
}

export default function ProspectBoard({
  available, posFilter, setPosFilter,
  showResults, userPickSlots, currentPickIdx, currentRound,
  pickNum, totalPicksThisRound,
  myPicks, lastCpuPicks, roundPickSlots, draftOrder,
  running, userTeam,
  onPick, onAutoPick, onNextRound,
}: Props) {
  const canPick = !showResults && userPickSlots.length > 0 && !running;

  return (
    <div>
      {/* On the clock banner */}
      {!showResults && userPickSlots.length > 0 && (
        <div style={{
          background: '#1a1a00', border: '1px solid #FF8740', borderRadius: 6,
          padding: '10px 16px', marginBottom: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: '#FF8740', marginBottom: 2 }}>
              ON THE CLOCK — ROUND {currentRound}
              {totalPicksThisRound > 1 ? ` · PICK ${currentPickIdx + 1}/${totalPicksThisRound}` : ''} · SLOT #{pickNum}
            </div>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#fff' }}>
              {userTeam.city} {userTeam.name}
            </div>
          </div>
          <button onClick={onAutoPick} disabled={!canPick} style={{
            padding: '5px 14px', fontSize: 11, cursor: canPick ? 'pointer' : 'not-allowed',
            background: canPick ? '#FF8740' : T.bgCard,
            border: `1px solid ${canPick ? '#FF8740' : T.borderFaint}`,
            borderRadius: 4, color: canPick ? '#000' : T.textDim, fontWeight: 'bold',
          }}>
            ⚡ Auto-Pick BPA
          </button>
        </div>
      )}

      {/* Round results panel */}
      {showResults && (
        <div style={{
          background: T.bgCard, border: `1px solid ${T.borderFaint}`,
          borderRadius: 6, padding: '12px 16px', marginBottom: 12,
        }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: T.textMuted, marginBottom: 10 }}>
            ROUND {currentRound} RESULTS
          </div>
          {myPicks.filter(p => p.round === currentRound).map((pick) => {
            const trait = TRAIT_META[pick.player.dev_trait] ?? TRAIT_META['Normal'];
            const revealed: string[] = JSON.parse(pick.player.revealed_attrs ?? '[]');
            const attrs: Record<string, string> = JSON.parse(pick.player.attributes_json ?? '{}');
            return (
              <div key={pick.player.id} style={{
                display: 'flex', gap: 8, alignItems: 'center',
                padding: '4px 0', fontSize: 11, flexWrap: 'wrap',
              }}>
                <span style={{ color: '#FF8740', fontWeight: 'bold', fontSize: 9 }}>YOUR PICK #{pick.slot}</span>
                <span style={{ color: '#fff' }}>{pick.player.first_name} {pick.player.last_name}</span>
                <span style={{ color: T.textMuted, fontSize: 9 }}>{pick.player.position}</span>
                {trait.short && (
                  <span style={{ background: trait.bg, color: trait.color, fontSize: 8, padding: '1px 4px', borderRadius: 2 }}>
                    {trait.short}
                  </span>
                )}
                <span style={{ color: ovrColor(pick.player.overall_rating), fontWeight: 'bold' }}>{pick.player.overall_rating} OVR</span>
                {revealed.map(a => (
                  <span key={a} style={{
                    fontSize: 10, fontWeight: 700, color: gradeColor(attrs[a] ?? '?'),
                    padding: '1px 5px', background: `${gradeColor(attrs[a] ?? '?')}18`,
                    borderRadius: 3, border: `1px solid ${gradeColor(attrs[a] ?? '?')}44`,
                  }} title={a}>
                    {attrs[a]}
                  </span>
                ))}
              </div>
            );
          })}
          {lastCpuPicks.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 9, letterSpacing: 1.5, color: T.textDim, marginBottom: 6 }}>
                CPU PICKS ({lastCpuPicks.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 180, overflowY: 'auto' }}>
                {lastCpuPicks.map((cp) => {
                  const trait = TRAIT_META[cp.prospect.dev_trait] ?? TRAIT_META['Normal'];
                  const teamName = draftOrder.find(t => t.id === cp.teamId);
                  return (
                    <div key={cp.prospect.id} style={{
                      display: 'flex', gap: 8, alignItems: 'center', fontSize: 10, color: T.textMuted,
                    }}>
                      <span style={{ color: T.textDim, fontSize: 9, minWidth: 20 }}>{cp.pickInRound}</span>
                      <span style={{ minWidth: 120, fontSize: 9 }}>{teamName?.city} {teamName?.name}</span>
                      <span style={{ color: '#ccc' }}>{cp.prospect.first_name} {cp.prospect.last_name}</span>
                      <span style={{ fontSize: 9 }}>{cp.prospect.position}</span>
                      {trait.short && (
                        <span style={{ background: trait.bg, color: trait.color, fontSize: 8, padding: '1px 4px', borderRadius: 2 }}>
                          {trait.short}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <button onClick={onNextRound} style={{
            marginTop: 12, padding: '6px 18px', fontSize: 11, fontWeight: 'bold',
            background: '#FF8740', border: 'none', borderRadius: 4,
            color: '#000', cursor: 'pointer',
          }}>
            {currentRound >= 7 ? 'View Draft Summary →' : `Start Round ${currentRound + 1} →`}
          </button>
        </div>
      )}

      {/* Position filter */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        {POSITIONS.map(pos => (
          <button key={pos} onClick={() => setPosFilter(pos)} style={{
            padding: '2px 7px',
            background: posFilter === pos ? '#FF8740' : T.bgCard,
            border: `1px solid ${posFilter === pos ? '#FF8740' : T.borderFaint}`,
            borderRadius: 3, color: posFilter === pos ? '#000' : T.textMuted,
            fontSize: 10, cursor: 'pointer', fontWeight: posFilter === pos ? 700 : 400,
          }}>{pos}</button>
        ))}
      </div>

      {/* Prospect list */}
      {available.length === 0 ? (
        <div style={{ color: T.textDim, fontSize: 11, padding: '16px 8px' }}>No prospects available.</div>
      ) : (
        <div>
          {available.map((p, index) => {
            const revealed: string[] = JSON.parse(p.revealed_attrs ?? '[]');
            const attrs: Record<string, string> = JSON.parse(p.attributes_json ?? '{}');
            const trait = TRAIT_META[p.dev_trait] ?? TRAIT_META['Normal'];
            const proj = p.projected_overall_pick ?? 0;
            const projRound = proj > 0 ? Math.ceil(proj / 32) : null;
            const projPick  = proj > 0 ? ((proj - 1) % 32) + 1 : null;
            const projLabel = projRound != null ? `Rd ${projRound} / ${projPick}` : '—';

            return (
              <div
                key={p.id}
                onClick={() => canPick && onPick(p)}
                onMouseEnter={e => { if (canPick) (e.currentTarget as HTMLElement).style.background = '#1e1e1e'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = T.bgCard; }}
                style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  padding: '8px 10px', background: T.bgCard, borderRadius: 5, marginBottom: 3,
                  cursor: canPick ? 'pointer' : 'default',
                  border: `1px solid ${canPick ? 'transparent' : T.borderFaint}`,
                  transition: 'background 0.1s',
                }}
              >
                {/* Rank */}
                <div style={{ fontSize: 10, color: T.textDim, minWidth: 22, paddingTop: 2 }}>
                  {index + 1}
                </div>

                {/* Name + combine stats */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: T.textPrimary, fontWeight: 600 }}>
                      {p.first_name} {p.last_name}
                    </span>
                    <span style={{ fontSize: 10, color: '#FF8740', fontWeight: 700 }}>{p.position}</span>
                    {trait.short && (
                      <span style={{
                        background: trait.bg, color: trait.color,
                        fontSize: 8, padding: '1px 4px', borderRadius: 2, fontWeight: 'bold',
                      }}>
                        {trait.short}
                      </span>
                    )}
                    <span style={{ fontSize: 9, color: '#4a6a4a', marginLeft: 'auto' }}>
                      {projLabel}
                    </span>
                  </div>

                  {/* Combine mini-stats */}
                  {(p.forty_time != null || p.bench_press != null) && (
                    <div style={{ fontSize: 9, marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {p.forty_time != null && (
                        <span style={{ color: fortyColor(p.forty_time) }}>40: {p.forty_time.toFixed(2)}s</span>
                      )}
                      {p.bench_press != null && (
                        <span style={{ color: benchColor(p.bench_press) }}>Bench: {p.bench_press}</span>
                      )}
                      {p.vertical_jump != null && (
                        <span style={{ color: vertColor(p.vertical_jump) }}>Vert: {p.vertical_jump}"</span>
                      )}
                      {p.cone_time != null && (
                        <span style={{ color: coneColor(p.cone_time) }}>Cone: {p.cone_time.toFixed(2)}s</span>
                      )}
                    </div>
                  )}

                  {/* Revealed attribute grade chips */}
                  {revealed.length > 0 && (
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 5 }}>
                      {revealed.map(attr => (
                        <span
                          key={attr}
                          title={attr}
                          style={{
                            fontSize: 10, fontWeight: 700,
                            color: gradeColor(attrs[attr] ?? '?'),
                            padding: '2px 6px', borderRadius: 4,
                            background: `${gradeColor(attrs[attr] ?? '?')}18`,
                            border: `1px solid ${gradeColor(attrs[attr] ?? '?')}44`,
                          }}
                        >
                          {attrs[attr]}
                          <span style={{ fontSize: 8, color: '#555', marginLeft: 3, fontWeight: 400 }}>{attr}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
