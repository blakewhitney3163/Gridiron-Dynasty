import React from 'react';
import { T } from '../theme';

interface Props {
  pendingResigns: number;
  draftComplete: boolean;
  draftGenerated: boolean;
  faOpen: boolean;
  rosterSize: number;
  refreshOffseasonStatus: () => void;
  onNavigate: (tab: string) => void;
  onOpenFreeAgency: () => void;
}

export default function OffseasonChecklist({
  pendingResigns, draftComplete, draftGenerated, faOpen, rosterSize,
  refreshOffseasonStatus, onNavigate, onOpenFreeAgency,
}: Props) {
  const linkBtn = (label: string, tab: string, active = false): React.CSSProperties => ({
    padding: '4px 12px',
    background: active ? T.bgGreen : T.bgPanel,
    border: `1px solid ${active ? '#1a4a1a' : T.borderMid}`,
    borderRadius: 3, color: active ? '#4caf50' : T.textMuted, fontSize: 10, cursor: 'pointer',
  });

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
          OFFSEASON CHECKLIST
        </span>
        <button onClick={refreshOffseasonStatus} style={{
          ...linkBtn('↺ refresh', ''), marginLeft: 'auto', fontSize: 10,
        }}>↺ refresh</button>
      </div>

      {/* Roster limit warning */}
      {rosterSize > 53 && (
        <div style={{ display: 'flex', gap: 12, padding: '10px 14px', borderRadius: 6,
          background: '#2a0a0a', border: '1px solid #e57373', marginBottom: 8 }}>
          <span style={{ color: '#e57373', fontSize: 18, lineHeight: 1 }}>✗</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#e57373', fontWeight: 700, fontSize: 12, letterSpacing: 0.5 }}>
              ROSTER OVER LIMIT — Cut {rosterSize - 53} player{rosterSize - 53 !== 1 ? 's' : ''} before advancing
            </div>
            <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>
              Active roster must be 53 or fewer
            </div>
          </div>
          <button onClick={() => onNavigate('franchise')}
            style={{ padding: '4px 12px', background: '#3a0a0a', border: '1px solid #e57373',
              borderRadius: 3, color: '#e57373', fontSize: 10, cursor: 'pointer' }}>
            → Cut Players
          </button>
        </div>
      )}

      {/* Re-signing */}
      <div style={{ display: 'flex', gap: 12, padding: '10px 14px', borderRadius: 6,
        background: pendingResigns === 0 ? '#0a1a0a' : '#1a1000',
        border: `1px solid ${pendingResigns === 0 ? '#2a4a2a' : '#FF874055'}`,
        marginBottom: 8 }}>
        <span style={{ color: pendingResigns === 0 ? '#4caf50' : '#FF8740', fontSize: 18, lineHeight: 1 }}>
          {pendingResigns === 0 ? '✓' : '⚠'}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#ccc', fontWeight: 600, fontSize: 12 }}>
            Re-signing Window {pendingResigns > 0
              ? `— ${pendingResigns} decision${pendingResigns !== 1 ? 's' : ''} pending`
              : '— Complete'}
          </div>
          <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>
            {pendingResigns > 0
              ? 'Players on expiring contracts need a decision before the season ends'
              : 'All expiring contracts addressed'}
          </div>
        </div>
        <button onClick={() => onNavigate('franchise')} style={linkBtn('→ Franchise', 'franchise')}>
          → Franchise
        </button>
      </div>

      {/* Free Agency */}
      <div style={{ display: 'flex', gap: 12, padding: '10px 14px', borderRadius: 6,
        background: faOpen ? '#0a1a0a' : '#141414',
        border: `1px solid ${faOpen ? '#2a4a2a' : '#222'}`,
        marginBottom: 8 }}>
        <span style={{ color: faOpen ? '#4caf50' : '#FF8740', fontSize: 18, lineHeight: 1 }}>
          {faOpen ? '✓' : '○'}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#ccc', fontWeight: 600, fontSize: 12 }}>
            Free Agency {faOpen ? '— Open' : '— Not Yet Open'}
          </div>
          <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>
            {faOpen
              ? 'Expired contracts processed — FAs available to sign'
              : 'Open free agency to release expired contracts and populate the FA pool'}
          </div>
        </div>
        {faOpen
          ? <button onClick={() => onNavigate('franchise')}
              style={{ padding: '4px 12px', background: '#0a1a0a', border: '1px solid #2a4a2a',
                borderRadius: 3, color: '#4caf50', fontSize: 10, cursor: 'pointer' }}>
              → Free Agents
            </button>
          : <button onClick={onOpenFreeAgency}
              style={{ padding: '4px 14px', background: '#FF8740', border: 'none',
                borderRadius: 3, color: '#000', fontSize: 10, fontWeight: 'bold', cursor: 'pointer' }}>
              OPEN FREE AGENCY
            </button>
        }
      </div>

      {/* Draft */}
      <div style={{ display: 'flex', gap: 12, padding: '10px 14px', borderRadius: 6,
        background: draftComplete ? '#0a1a0a' : '#141414',
        border: `1px solid ${draftComplete ? '#2a4a2a' : '#222'}` }}>
        <span style={{ color: draftComplete ? '#4caf50' : '#555', fontSize: 18, lineHeight: 1 }}>
          {draftComplete ? '✓' : '○'}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#ccc', fontWeight: 600, fontSize: 12 }}>
            NFL Draft {draftComplete ? '— Complete' : draftGenerated ? '— In Progress' : '— Not Started'}
          </div>
          <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>
            {draftComplete
              ? '7 rounds complete — rookies added to rosters'
              : '7 rounds · reverse standings order · CPU auto-picks'}
          </div>
        </div>
        <button onClick={() => onNavigate('draft')} style={linkBtn('→ Draft', 'draft', !draftComplete)}>
          {draftComplete ? '→ View' : '→ Draft'}
        </button>
      </div>
    </div>
  );
}
