import React, { useState } from 'react';
import { T } from '../theme';

interface AnnouncingRetirement {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  position_label: string;
  age: number;
  overall_rating: number;
  annual_salary: number | null;
}

interface RetirementResult {
  accepted: boolean;
  salary?: number;
}

interface Props {
  pendingResigns: number;
  draftComplete: boolean;
  draftGenerated: boolean;
  faOpen: boolean;
  rosterSize: number;
  announcingRetirements: AnnouncingRetirement[];
  refreshOffseasonStatus: () => void;
  onNavigate: (tab: string) => void;
  onOpenFreeAgency: () => void;
  onMakeOffer: (playerId: number) => Promise<{ accepted: boolean; name: string; salary?: number }>;
  onLetGo: (playerId: number) => Promise<void>;
}

export default function OffseasonChecklist({
  pendingResigns, draftComplete, draftGenerated, faOpen, rosterSize,
  announcingRetirements, refreshOffseasonStatus, onNavigate,
  onOpenFreeAgency, onMakeOffer, onLetGo,
}: Props) {
  const [results, setResults] = useState<Record<number, RetirementResult>>({});
  const [working, setWorking] = useState<Set<number>>(new Set());

  const handleOffer = async (playerId: number) => {
    setWorking(prev => new Set([...prev, playerId]));
    const res = await onMakeOffer(playerId);
    setResults(prev => ({ ...prev, [playerId]: { accepted: res.accepted, salary: res.salary } }));
    setWorking(prev => { const s = new Set(prev); s.delete(playerId); return s; });
  };

  const handleLetGo = async (playerId: number) => {
    setWorking(prev => new Set([...prev, playerId]));
    await onLetGo(playerId);
    setResults(prev => ({ ...prev, [playerId]: { accepted: false } }));
    setWorking(prev => { const s = new Set(prev); s.delete(playerId); return s; });
  };

  const linkBtn = (active = false): React.CSSProperties => ({
    padding: '4px 12px',
    background: active ? T.bgGreen : T.bgPanel,
    border: `1px solid ${active ? '#1a4a1a' : T.borderMid}`,
    borderRadius: 3, color: active ? '#4caf50' : T.textMuted, fontSize: 10, cursor: 'pointer',
  });

  return (
    <div style={{ background: T.bgPanel, border: `1px solid ${T.borderMid}`, borderRadius: 8, padding: '16px 20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 9, letterSpacing: 2, color: T.textMuted, textTransform: 'uppercase' }}>
          OFFSEASON CHECKLIST
        </div>
        <button onClick={refreshOffseasonStatus} style={{ fontSize: 9, color: T.textDim, background: 'none', border: 'none', cursor: 'pointer' }}>
          ↺ refresh
        </button>
      </div>

      {/* Retirement Announcements */}
      {announcingRetirements.length > 0 && (
        <div style={{ marginBottom: 14, padding: '10px 14px', background: '#150808', border: '1px solid #4a1515', borderRadius: 6 }}>
          <div style={{ fontSize: 9, letterSpacing: 1.5, color: '#e57373', marginBottom: 10, textTransform: 'uppercase', fontWeight: 700 }}>
            ⚠ Retirement Announcements — {announcingRetirements.length} Player{announcingRetirements.length !== 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: 10, color: T.textDim, marginBottom: 10 }}>
            Make a one-year offer to convince them to return — but they may still say no.
          </div>
          {announcingRetirements.map(p => {
            const result = results[p.id];
            const busy = working.has(p.id);
            const posLabel = p.position_label || p.position;
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: `1px solid #2a1212` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: T.textPrimary, fontWeight: 600 }}>
                    {p.first_name} {p.last_name}
                  </div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>
                    {posLabel} · Age {p.age} · {p.overall_rating} OVR
                    {p.annual_salary ? ` · $${p.annual_salary.toFixed(1)}M` : ''}
                  </div>
                </div>
                {result ? (
                  <div style={{
                    fontSize: 10, fontStyle: 'italic', textAlign: 'right',
                    color: result.accepted ? '#4caf50' : '#e57373',
                  }}>
                    {result.accepted
                      ? `✓ Returning — 1yr $${result.salary?.toFixed(1)}M`
                      : '✗ Retired'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleOffer(p.id)}
                      disabled={busy}
                      style={{
                        fontSize: 10, padding: '4px 10px',
                        background: busy ? T.bgCard : '#0a2a0a',
                        border: `1px solid ${busy ? T.borderMid : '#2a5a2a'}`,
                        borderRadius: 3, color: busy ? T.textDim : '#4caf50',
                        cursor: busy ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {busy ? '…' : 'Make Offer'}
                    </button>
                    <button
                      onClick={() => handleLetGo(p.id)}
                      disabled={busy}
                      style={{
                        fontSize: 10, padding: '4px 10px',
                        background: T.bgCard,
                        border: `1px solid ${T.borderMid}`,
                        borderRadius: 3, color: T.textMuted,
                        cursor: busy ? 'not-allowed' : 'pointer',
                        opacity: busy ? 0.5 : 1,
                      }}
                    >
                      Let Go
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Roster limit warning */}
      {rosterSize > 53 && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.borderFaint}`, marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#e57373', flexShrink: 0 }}>✗</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#e57373', fontWeight: 600 }}>
              ROSTER OVER LIMIT — Cut {rosterSize - 53} player{rosterSize - 53 !== 1 ? 's' : ''} before advancing
            </div>
            <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>Active roster must be 53 or fewer</div>
          </div>
          <button
            onClick={() => onNavigate('myteam')}
            style={{ padding: '4px 12px', background: '#3a0a0a', border: '1px solid #e57373', borderRadius: 3, color: '#e57373', fontSize: 10, cursor: 'pointer' }}
          >
            → Cut Players
          </button>
        </div>
      )}

      {/* Re-signing */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.borderFaint}` }}>
        <span style={{ fontSize: 12, color: pendingResigns === 0 ? '#4caf50' : '#FF8740', flexShrink: 0 }}>
          {pendingResigns === 0 ? '✓' : '⚠'}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: T.textSecondary, fontWeight: 600 }}>
            Re-signing Window {pendingResigns > 0
              ? `— ${pendingResigns} decision${pendingResigns !== 1 ? 's' : ''} pending`
              : '— Complete'}
          </div>
          <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>
            {pendingResigns > 0
              ? 'Players on expiring contracts need a decision before the season ends'
              : 'All expiring contracts addressed'}
          </div>
        </div>
        <button onClick={() => onNavigate('myteam')} style={linkBtn()}>→ My Team</button>
      </div>

      {/* Free Agency */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.borderFaint}` }}>
        <span style={{ fontSize: 12, color: faOpen ? '#4caf50' : T.textDim, flexShrink: 0 }}>
          {faOpen ? '✓' : '○'}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: T.textSecondary, fontWeight: 600 }}>
            Free Agency {faOpen ? '— Open' : '— Not Yet Open'}
          </div>
          <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>
            {faOpen
              ? 'Expired contracts processed — FAs available to sign'
              : 'Open free agency to release expired contracts and populate the FA pool'}
          </div>
        </div>
        {faOpen ? (
          <button onClick={() => onNavigate('myteam')} style={linkBtn(true)}>→ Free Agents</button>
        ) : (
          <button
            onClick={onOpenFreeAgency}
            style={{ padding: '4px 12px', background: '#0a1a0a', border: '1px solid #2a5a2a', borderRadius: 3, color: '#4caf50', fontSize: 10, cursor: 'pointer' }}
          >
            OPEN FREE AGENCY
          </button>
        )}
      </div>

      {/* Draft */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0' }}>
        <span style={{ fontSize: 12, color: draftComplete ? '#4caf50' : T.textDim, flexShrink: 0 }}>
          {draftComplete ? '✓' : '○'}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: T.textSecondary, fontWeight: 600 }}>
            NFL Draft {draftComplete ? '— Complete' : draftGenerated ? '— In Progress' : '— Not Started'}
          </div>
          <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>
            {draftComplete
              ? '7 rounds complete — rookies added to rosters'
              : '7 rounds · reverse standings order · CPU auto-picks'}
          </div>
        </div>
        <button onClick={() => onNavigate('draft')} style={linkBtn(!draftComplete)}>
          {draftComplete ? '→ View' : '→ Draft'}
        </button>
      </div>
    </div>
  );
}
