import React from 'react';
import { T } from '../theme';
import { Prospect, MyPick, CpuPick, PickSlot, DraftTeam } from './types';
import { POSITIONS, TRAIT_META, ovrColor, maskedOvr, preScoutTier, draftGrade } from './draftUtils';

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
  scoutsLeft, scouting, running, userTeam,
  onPick, onAutoPick, onScout, onNextRound,
}: Props) {
  const canPick = !showResults && userPickSlots.length > 0 && !running;
  const canScout = scoutsLeft > 0 && scouting === null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'monospace' }}>

      {/* On the clock banner */}
      {!showResults && userPickSlots.length > 0 && (
        <div style={{ background: '#1a2a1a', border: '1px solid #2a4a2a', borderRadius: 6, padding: '10px 14px', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: T.textDim, letterSpacing: 1, marginBottom: 2 }}>
              ON THE CLOCK — ROUND {currentRound}
              {totalPicksThisRound > 1 ? ` · PICK ${currentPickIdx + 1}/${totalPicksThisRound}` : ''} · SLOT #{pickNum}
            </div>
            <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 13 }}>
              {userTeam.city} {userTeam.name}
            </div>
          </div>
          <button
            onClick={onAutoPick}
            disabled={running}
            style={{
              padding: '6px 14px', fontSize: 11, fontWeight: 700,
              background: running ? T.bgCard : '#FF8740',
              color: running ? T.textMuted : '#000',
              border: 'none', borderRadius: 4, cursor: running ? 'not-allowed' : 'pointer',
            }}
          >
            ⚡ Auto-Pick BPA
          </button>
        </div>
      )}

      {/* Round results panel */}
      {showResults && (
        <div style={{ background: T.bgPanel, borderRadius: 6, padding: 12, marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textPrimary, marginBottom: 8, letterSpacing: 1 }}>
            ROUND {currentRound} RESULTS
          </div>
          {myPicks.filter(p => p.round === currentRound).map((pick) => {
            const trait = TRAIT_META[pick.player.dev_trait] ?? TRAIT_META['Normal'];
            return (
              <div key={pick.slot} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: '#FF8740', fontWeight: 700 }}>YOUR PICK #{pick.slot}</span>
                <span style={{ color: T.textPrimary, fontWeight: 600 }}>{pick.player.first_name} {pick.player.last_name}</span>
                <span style={{ color: T.textMuted }}>{pick.player.position}</span>
                {trait.short && <span style={{ fontSize: 8, color: trait.color, background: trait.bg, borderRadius: 2, padding: '1px 3px', fontWeight: 700 }}>{trait.short}</span>}
                <span style={{ color: ovrColor(pick.player.overall_rating), fontWeight: 700 }}>{pick.player.overall_rating}</span>
                <span style={{ color: T.textMuted }}>{pick.grade}</span>
              </div>
            );
          })}
          {lastCpuPicks.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 9, color: T.textDim, letterSpacing: 1, marginBottom: 6 }}>
                CPU PICKS ({lastCpuPicks.length})
              </div>
              <div style={{ maxHeight: 160, overflowY: 'auto' }}>
                {lastCpuPicks.map((cp) => {
                  const trait = TRAIT_META[cp.prospect.dev_trait] ?? TRAIT_META['Normal'];
                  const teamName = draftOrder.find(t => t.id === cp.teamId);
                  return (
                    <div key={`${cp.teamId}-${cp.pickInRound}`} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, marginBottom: 3 }}>
                      <span style={{ color: T.textDim, width: 20 }}>{cp.pickInRound}</span>
                      <span style={{ color: T.textMuted, flex: 1 }}>{teamName?.city} {teamName?.name}</span>
                      <span style={{ color: T.textPrimary }}>{cp.prospect.first_name} {cp.prospect.last_name}</span>
                      <span style={{ color: T.textMuted }}>{cp.prospect.position}</span>
                      {trait.short && <span style={{ fontSize: 8, color: trait.color, background: trait.bg, borderRadius: 2, padding: '1px 3px', fontWeight: 700 }}>{trait.short}</span>}
                      <span style={{ color: ovrColor(cp.prospect.overall_rating), fontWeight: 700 }}>{cp.prospect.overall_rating}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <button
            onClick={onNextRound}
            style={{
              marginTop: 10, padding: '6px 14px', fontSize: 11, fontWeight: 700,
              background: '#FF8740', color: '#000', border: 'none', borderRadius: 4, cursor: 'pointer',
            }}
          >
            {currentRound >= 7 ? 'View Draft Summary →' : `Start Round ${currentRound + 1} →`}
          </button>
        </div>
      )}

      {/* Position filter */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
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

      {/* Column header */}
      <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 42px 90px 50px 60px 70px', gap: 4, padding: '3px 8px', fontSize: 9, color: T.textDim, letterSpacing: 1 }}>
        {['#', 'NAME', 'POS', 'SCOUTING', 'AGE', 'OVR', ''].map((h, i) => (
          <span key={i}>{h}</span>
        ))}
      </div>

      {/* Prospect list */}
      {available.length === 0 ? (
        <div style={{ color: T.textMuted, padding: 16, fontSize: 12 }}>No prospects available.</div>
      ) : (
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {available.map((p, index) => {
            const isScout = p.scouted === 1;
            const tier = preScoutTier(p.id, p.overall_rating);
            const trait = TRAIT_META[p.dev_trait] ?? TRAIT_META['Normal'];
            draftGrade(p.overall_rating);
            return (
              <div
                key={p.id}
                onClick={() => canPick && onPick(p)}
                onMouseEnter={e => { if (canPick) (e.currentTarget as HTMLElement).style.background = '#2a2a2a'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = T.bgCard; }}
                style={{
                  display: 'grid', gridTemplateColumns: '28px 1fr 42px 90px 50px 60px 70px',
                  gap: 4, alignItems: 'center', padding: '6px 8px',
                  background: T.bgCard, borderRadius: 4, marginBottom: 2,
                  cursor: canPick ? 'pointer' : 'default',
                  border: `1px solid ${canPick ? 'transparent' : T.borderFaint}`,
                  transition: 'background 0.1s',
                  boxSizing: 'border-box',
                }}
              >
                <span style={{ color: T.textDim, fontSize: 10 }}>{index + 1}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12, color: T.textPrimary }}>{p.first_name} {p.last_name}</div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>Age {p.age}</div>
                </div>
                <span style={{ color: T.textMuted, fontSize: 11 }}>{p.position}</span>
                <span style={{ fontSize: 10, color: isScout ? T.green : tier.color }}>
                  {isScout ? 'SCOUTED' : tier.label}
                </span>
                <span style={{ color: T.textMuted, fontSize: 11 }}>{p.age}</span>
                <span>
                  {isScout ? (
                    <>
                      <span style={{ color: ovrColor(p.overall_rating), fontWeight: 700, fontSize: 12 }}>{p.overall_rating}</span>
                      {trait.short && (
                        <span style={{ fontSize: 8, fontWeight: 700, color: trait.color, background: trait.bg, borderRadius: 2, padding: '1px 3px', marginLeft: 3 }}>
                          {trait.short}
                        </span>
                      )}
                    </>
                  ) : (
                    <span style={{ color: T.textMuted, fontSize: 11 }}>{maskedOvr(p.id, p.overall_rating)}</span>
                  )}
                </span>
                <span>
                  {!isScout && (
                    <button
                      onClick={e => { e.stopPropagation(); if (canScout) onScout(p.id); }}
                      disabled={!canScout || scouting === p.id}
                      style={{
                        fontSize: 9, padding: '2px 6px',
                        background: canScout ? T.bgInput : 'transparent',
                        border: `1px solid ${canScout ? T.borderFaint : 'transparent'}`,
                        borderRadius: 3,
                        color: canScout ? T.textMuted : T.textDim,
                        cursor: canScout ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {scouting === p.id ? '...' : 'Scout'}
                    </button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
