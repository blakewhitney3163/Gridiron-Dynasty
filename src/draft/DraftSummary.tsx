import React from 'react';
import { T } from '../theme';
import { MyPick } from './types';
import { ROUND_LABELS, TRAIT_META, draftGrade } from './draftUtils';

interface Props {
  userTeam: { id: number; city: string; name: string };
  currentSeason: number;
  myPicks: MyPick[];
  running: boolean;
  onComplete: () => void;
}

export default function DraftSummary({ userTeam, currentSeason, myPicks, running, onComplete }: Props) {
  const sorted = [...myPicks].sort((a, b) => a.round - b.round);
  const bestPick = sorted.length > 0
    ? sorted.reduce((best, p) => p.player.overall_rating > best.player.overall_rating ? p : best, sorted[0])
    : null;
  const gpa = sorted.reduce((s, p) => s + p.player.overall_rating, 0) / Math.max(sorted.length, 1);
  const classGrade = draftGrade(Math.round(gpa));

  return (
    <div style={{ padding: '20px 24px', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ color: T.textPrimary, fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Draft Complete</h1>
      <p style={{ color: T.textDim, fontSize: 12, margin: '0 0 20px' }}>
        {currentSeason} NFL Draft · {userTeam.city} {userTeam.name}
      </p>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ background: T.bgCard, border: `1px solid ${T.borderFaint}`, borderRadius: 8, padding: '12px 20px', textAlign: 'center' }}>
          <div style={{ color: T.textDim, fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>DRAFT CLASS GRADE</div>
          <div style={{ color: classGrade.color, fontWeight: 700, fontSize: 32 }}>{classGrade.grade}</div>
        </div>
        <div style={{ background: T.bgCard, border: `1px solid ${T.borderFaint}`, borderRadius: 8, padding: '12px 20px', textAlign: 'center' }}>
          <div style={{ color: T.textDim, fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>PICKS MADE</div>
          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 32 }}>{sorted.length}</div>
        </div>
        {bestPick && (
          <div style={{ background: T.bgCard, border: `1px solid ${T.borderFaint}`, borderRadius: 8, padding: '12px 20px', flex: 1 }}>
            <div style={{ color: T.textDim, fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>BEST PICK</div>
            <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 14 }}>
              {bestPick.player.first_name} {bestPick.player.last_name}
            </div>
            <div style={{ color: T.textMuted, fontSize: 11 }}>
              {bestPick.player.position} · {bestPick.player.overall_rating} OVR · Round {bestPick.round}
            </div>
          </div>
        )}
      </div>

      {/* Pick list */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: T.textDim, fontSize: 10, letterSpacing: 1, marginBottom: 10 }}>YOUR DRAFT HAUL</div>
        {sorted.map((pick, i) => {
          const trait = TRAIT_META[pick.player.dev_trait] ?? TRAIT_META['Normal'];
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', marginBottom: 4,
              background: T.bgCard, borderRadius: 5,
            }}>
              <span style={{ color: T.textDim, fontSize: 11, width: 60 }}>{ROUND_LABELS[pick.round]} Rd #{pick.slot}</span>
              <span style={{ color: T.textPrimary, fontWeight: 600, flex: 1 }}>
                {pick.player.first_name} {pick.player.last_name}
              </span>
              <span style={{ color: T.textMuted, fontSize: 11, width: 32 }}>{pick.player.position}</span>
              {trait.short && (
                <span style={{ color: trait.color, fontSize: 9, fontWeight: 700, background: T.bgPanel, padding: '1px 4px', borderRadius: 3 }}>
                  {trait.short}
                </span>
              )}
              <span style={{ color: pick.player.overall_rating >= 78 ? '#4caf50' : T.textMuted, fontWeight: 700, width: 28, textAlign: 'right' }}>
                {pick.player.overall_rating}
              </span>
              <span style={{ color: pick.gradeColor, fontWeight: 700, width: 24, textAlign: 'right' }}>{pick.grade}</span>
            </div>
          );
        })}
      </div>

      <button
        onClick={onComplete}
        disabled={running}
        style={{
          padding: '10px 24px', fontWeight: 700, fontSize: 13, borderRadius: 5, cursor: running ? 'not-allowed' : 'pointer',
          background: running ? T.bgPanel : T.bgGreen,
          border: `1px solid ${running ? T.borderFaint : '#2a4a2a'}`,
          color: running ? T.textDim : '#4caf50',
        }}
      >
        {running ? 'Processing...' : '✓ Complete Draft & Return to Offseason'}
      </button>
    </div>
  );
}
