import React, { useEffect, useState } from 'react';

declare const window: any;

const MARKET_COLOR: Record<string, string> = {
  large:  '#FFD700',
  medium: '#FF8740',
  small:  '#4FC3F7',
};

const MARKET_LABEL: Record<string, string> = {
  large:  'Large Market',
  medium: 'Mid Market',
  small:  'Small Market',
};

const PERSONALITY_LABEL: Record<string, { label: string; color: string; desc: string }> = {
  win_now:     { label: 'Win Now',     color: '#e57373', desc: 'Spends aggressively on veterans. Premium on elite FAs.' },
  analytics:   { label: 'Analytics',  color: '#4FC3F7', desc: 'Values efficiency over star power. Patient in free agency.' },
  old_school:  { label: 'Old School', color: '#FF8740', desc: 'Loyal to proven players. Resigns aging vets at a premium.' },
  rebuilder:   { label: 'Rebuilder',  color: '#66BB6A', desc: 'Hoards picks and youth. Rarely bids on expensive FAs.' },
  star_chaser: { label: 'Star Chaser',color: '#FFD700', desc: 'Will overpay for superstar talent at any cost.' },
  balanced:    { label: 'Balanced',   color: '#aaa',    desc: 'No strong inclination — reacts to team needs.' },
};

interface Finances {
  market_size: string;
  stadium_capacity: number;
  season_revenue: number;
  owner_budget: number;
  attendance_rate?: number;
}

interface Props {
  teamId: number;
  currentSeason: number;
}

export default function FinancesTab({ teamId, currentSeason }: Props) {
  const [finances, setFinances] = useState<Finances | null>(null);
  const [gmPersonality, setGmPersonality] = useState<string>('balanced');
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      window.api.getTeamFinances?.(teamId),
      window.api.getAllTeamFinances?.(),
      window.api.getAllGmPersonalities?.(),
    ]).then(([f, all, gms]) => {
      setFinances(f ?? null);
      setAllTeams(all ?? []);
      const mine = (gms ?? []).find((r: any) => r.id === teamId);
      if (mine) setGmPersonality(mine.gm_personality ?? 'balanced');
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [teamId]);

  if (loading) return <div style={{ color: '#555', padding: 24 }}>Loading finances...</div>;
  if (!finances) return (
    <div style={{ color: '#555', padding: 24 }}>
      Financial data not available. Make sure database migrations have run.
    </div>
  );

  const mc = MARKET_COLOR[finances.market_size] ?? '#888';
  const attendancePct = finances.attendance_rate ? Math.round(finances.attendance_rate * 100) : null;
  const estimatedAttendance = finances.attendance_rate
    ? Math.round(finances.stadium_capacity * finances.attendance_rate).toLocaleString()
    : null;
  const attendColor = attendancePct && attendancePct >= 80 ? '#4caf50' : attendancePct && attendancePct >= 65 ? '#FF8740' : '#e57373';
  const pmeta = PERSONALITY_LABEL[gmPersonality] ?? PERSONALITY_LABEL['balanced'];

  return (
    <div style={{ padding: '0 0 32px' }}>
      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 10, letterSpacing: 2, color: '#555' }}>TEAM FINANCES — {currentSeason} SEASON</span>
      </div>

      {/* Market + Revenue Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'MARKET SIZE',      value: MARKET_LABEL[finances.market_size] ?? finances.market_size, color: mc, sub: null },
          { label: 'STADIUM CAPACITY', value: finances.stadium_capacity.toLocaleString(), color: '#aaa', sub: null },
          { label: 'SEASON REVENUE',   value: `$${finances.season_revenue.toFixed(0)}M`, color: '#4caf50', sub: 'driven by wins + market' },
          { label: 'ATTENDANCE RATE',  value: attendancePct ? `${attendancePct}%` : 'N/A', color: attendColor, sub: estimatedAttendance ? `~${estimatedAttendance}/game` : null },
        ].map(({ label, value, color, sub }) => (
          <div key={label} style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 6, padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 8, color: '#444', letterSpacing: 1.5, marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
            {sub && <div style={{ fontSize: 10, color: '#444', marginTop: 4 }}>{sub}</div>}
          </div>
        ))}
      </div>

      {/* GM Personality */}
      <div style={{ background: '#0d0d0d', border: `1px solid ${pmeta.color}33`, borderRadius: 6, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 9, color: '#444', letterSpacing: 1.5 }}>GM PHILOSOPHY</span>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 3,
          background: `${pmeta.color}22`, border: `1px solid ${pmeta.color}`, color: pmeta.color,
        }}>{pmeta.label.toUpperCase()}</span>
        <span style={{ fontSize: 11, color: '#555' }}>{pmeta.desc}</span>
      </div>

      {/* Owner Budget */}
      <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 6, padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ fontSize: 9, letterSpacing: 2, color: '#555', marginBottom: 12 }}>OWNER BUDGET</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1, background: '#0a0a0a', borderRadius: 4, height: 8, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, (finances.season_revenue / finances.owner_budget) * 100)}%`, height: '100%', background: '#4caf50', borderRadius: 4 }} />
          </div>
          <div style={{ fontSize: 13, color: '#4caf50', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
            ${finances.season_revenue.toFixed(0)}M / ${finances.owner_budget.toFixed(0)}M
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#444', marginTop: 8 }}>
          {finances.market_size === 'large'
            ? 'Large market — strong FA appeal, premium revenue floor. Revenue grows with winning.'
            : finances.market_size === 'small'
            ? 'Small market — tight budget, rely on the draft and development. Winning helps fill seats.'
            : 'Mid market — solid foundation, balanced approach. Revenue fluctuates with results.'}
        </div>
      </div>

      {/* League Market Breakdown */}
      <div>
        <div style={{ fontSize: 9, letterSpacing: 2, color: '#444', marginBottom: 12 }}>LEAGUE REVENUE RANKING</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
          {allTeams.slice(0, 16).map((t: any) => {
            const tc = MARKET_COLOR[t.market_size] ?? '#888';
            return (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px',
                background: t.id === teamId ? '#1a1a0a' : '#0d0d0d',
                border: `1px solid ${t.id === teamId ? '#FF874044' : '#1a1a1a'}`,
                borderRadius: 4,
              }}>
                <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 2, background: `${tc}22`, color: tc }}>{(t.market_size ?? 'M')[0].toUpperCase()}</span>
                <span style={{ fontSize: 11, color: t.id === teamId ? '#fff' : '#888', flex: 1 }}>{t.city} {t.name}</span>
                <span style={{ fontSize: 10, color: '#4caf50', fontFamily: 'monospace' }}>${(t.season_revenue ?? 0).toFixed(0)}M</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
