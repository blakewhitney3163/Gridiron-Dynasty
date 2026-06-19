import React, { useState } from 'react';
import { T } from './theme';

declare const window: any;

type ImportStatus = 'idle' | 'running' | 'done' | 'error';
interface ImportState { status: ImportStatus; message: string; }
const IDLE: ImportState = { status: 'idle', message: '' };

function formatResult(res: any): string {
  if (res.imported !== undefined && res.contractsGenerated !== undefined) {
    return `${res.imported} players imported. Contracts ${res.contractsGenerated ? 'auto-generated from ratings' : 'loaded from CSV'}.`;
  }
  if (res.imported !== undefined) return `${res.imported} rows imported successfully.`;
  return 'Import complete.';
}

export default function Import() {
  const [teams,   setTeams]   = useState<ImportState>(IDLE);
  const [players, setPlayers] = useState<ImportState>(IDLE);

  const run = async (
    apiFn: () => Promise<any>,
    set: React.Dispatch<React.SetStateAction<ImportState>>
  ) => {
    set({ status: 'running', message: '' });
    try {
      const res = await apiFn();
      if (res.success) {
        set({ status: 'done', message: formatResult(res) });
      } else if (res.reason === 'Cancelled') {
        set(IDLE);
      } else {
        set({ status: 'error', message: res.reason ?? 'Unknown error' });
      }
    } catch (e: any) {
      set({ status: 'error', message: e.message ?? 'Unknown error' });
    }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 780, margin: '0 auto', fontFamily: 'monospace' }}>
      <div style={{ fontSize: 10, letterSpacing: 4, color: T.textDim, marginBottom: 6 }}>GRIDIRON DYNASTY</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#4FC3F7', letterSpacing: 3, marginBottom: 4 }}>
        CUSTOM DATA IMPORT
      </div>
      <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8, letterSpacing: 1 }}>
        Replace generated content with your own CSV data.
      </div>
      <div style={{ fontSize: 10, color: T.textDim, marginBottom: 32, lineHeight: 1.8 }}>
        Recommended order: import <strong style={{ color: T.textMuted }}>Teams</strong> first (if customizing), then <strong style={{ color: T.textMuted }}>Players</strong>.
        Historical record benchmarks are imported from the <strong style={{ color: T.textMuted }}>Records</strong> tab.
      </div>

      <ImportCard
        title="CUSTOM TEAMS"
        badge="STEP 1"
        description="Replace all default teams with teams from a CSV. This triggers a full dynasty reset — all season data, players, contracts, and history will be cleared and regenerated for your new teams."
        warning="FULL RESET — all current dynasty data will be erased. You will need to select a team again after importing."
        hint="Required columns: city, name, abbreviation, conference, division"
        docsLink="See docs/csv-schema.md for full schema and example."
        state={teams}
        onImport={() => run(() => window.api.importCustomTeams(), setTeams)}
        onReset={() => setTeams(IDLE)}
      />

      <ImportCard
        title="CUSTOM PLAYERS / ROSTER"
        badge="STEP 2"
        description="Replace all players and contracts with a custom roster from a CSV. Teams remain unchanged. If annual_salary and years_remaining columns are present they are used directly; otherwise contracts are auto-generated from ratings."
        warning="CLEARS all players, contracts, depth charts, and career history across every team."
        hint="Required: first_name, last_name, position. Key optional: team_abbreviation (leave blank or use FA for free agents), age, overall_rating, dev_trait, speed, strength, awareness, throw_accuracy, throw_power, catching, route_running, tackle_rating, coverage, pass_rush, kickpower, kickaccuracy, runblocking, passblocking, annual_salary, years_remaining."
        docsLink="See docs/csv-schema.md for full schema and example."
        state={players}
        onImport={() => run(() => window.api.importCustomPlayers(), setPlayers)}
        onReset={() => setPlayers(IDLE)}
      />
    </div>
  );
}

// ─── Import Card ──────────────────────────────────────────────────────────────

interface CardProps {
  title: string;
  badge: string;
  description: string;
  warning: string;
  hint: string;
  docsLink: string;
  state: ImportState;
  onImport: () => void;
  onReset: () => void;
}

function ImportCard({ title, badge, description, warning, hint, docsLink, state, onImport, onReset }: CardProps) {
  return (
    <div style={{
      background: T.bgCard,
      border: `1px solid ${T.borderFaint}`,
      borderRadius: 6,
      padding: 24,
      marginBottom: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 3, color: '#4FC3F7' }}>{title}</div>
        <div style={{
          fontSize: 9, letterSpacing: 2, fontWeight: 700,
          color: '#4FC3F7', background: '#0d2233',
          border: '1px solid #4FC3F7', borderRadius: 2,
          padding: '2px 6px',
        }}>
          {badge}
        </div>
      </div>

      <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.8, marginBottom: 12 }}>
        {description}
      </div>

      <div style={{
        fontSize: 10, letterSpacing: 1, color: '#e57373',
        background: '#2a1010', border: '1px solid #5a2020',
        borderRadius: 3, padding: '6px 10px', marginBottom: 12,
      }}>
        ⚠ {warning}
      </div>

      <div style={{ fontSize: 10, color: T.textDim, lineHeight: 1.7, marginBottom: 6, fontStyle: 'italic' }}>
        {hint}
      </div>
      <div style={{ fontSize: 10, color: T.textDim, marginBottom: 20 }}>{docsLink}</div>

      {state.status === 'idle' && (
        <button onClick={onImport} style={{
          padding: '10px 20px', fontSize: 11, fontWeight: 'bold', letterSpacing: 2,
          background: '#1a2a1a', color: '#4caf50',
          border: '1px solid #4caf50', borderRadius: 4,
          cursor: 'pointer', fontFamily: 'monospace',
        }}>
          SELECT CSV &amp; IMPORT
        </button>
      )}

      {state.status === 'running' && (
        <div style={{ fontSize: 11, color: T.textMuted, letterSpacing: 2 }}>IMPORTING...</div>
      )}

      {state.status === 'done' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 11, color: '#4caf50' }}>✓ {state.message}</div>
          <button onClick={onReset} style={{
            fontSize: 10, color: T.textDim, background: 'none', border: 'none',
            cursor: 'pointer', textDecoration: 'underline', fontFamily: 'monospace',
          }}>
            import again
          </button>
        </div>
      )}

      {state.status === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, color: '#e57373', lineHeight: 1.6 }}>✗ {state.message}</div>
          <button onClick={onReset} style={{
            width: 'fit-content', fontSize: 10, color: T.textDim, background: 'none',
            border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'monospace',
          }}>
            try again
          </button>
        </div>
      )}
    </div>
  );
}
