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

const PERSONALITY_LABEL: Record<string, { label: string; color: string }> = {
  win_now:     { label: 'Win Now',    color: '#e57373' },
  analytics:   { label: 'Analytics', color: '#4FC3F7' },
  old_school:  { label: 'Old School', color: '#FF8740' },
  rebuilder:   { label: 'Rebuilder', color: '#66BB6A' },
  star_chaser: { label: 'Star Chaser', color: '#FFD700' },
  balanced:    { label: 'Balanced',   color: '#aaa'    },
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
  const [allTeams, setAllTeams] = useState<{ id: number; city: string; name: string; market_size: string; season_revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      window.api.getTeamFinances?.(teamId),
      window.api.getAllTeamFinances?.(),
    ]).then(([f, all]) => {
      setFinances(f ?? null);
      setAllTeams(all ?? []);
      // Get GM personality from teams list
      const myTeam = (all ?? []).find((t: any) => t.id === teamId);
      setLoading(false);
    }).catch(() => setLoading(false));

    // Also fetch gm personality from the all-teams list
    window.api.getAllGmPersonalities?.().then((rows: any[]) => {
      const mine = rows?.find((r: any) => r.id === teamId);
      if (mine) setGmPersonality(mine.gm_personality ?? 'balanced');
    }).catch(() => {});
  }, [teamId]);

  if (loading) return <div style={{ color: '#555', padding: 24 }}>Loading finances...</div>;
  if (!finances) return (
    <div style={{ color: '#555', padding: 24 }}>
      Financial data not available. Make sure database migration v18 has run.
    </div>
  );

  const mc = MARKET_COLOR[finances.market_size] ?? '#888';
  const attendancePct = finances.attendance_rate ? Math.round(finances.attendance_rate * 100) : null;
  const estimatedAttendance = finances.attendance_rate
    ? Math.round(finances.stadium_capacity * finances.attendance_rate).toLocaleString()
    : null;
  const pmeta = PERSONALITY_LABEL[gmPersonality] ?? PERSONALITY_LABEL['balanced'];

  return (
    <div style={{ padding: '0 0 32px' }}>
      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 10, letterSpacing: 2, color: '#555' }}>TEAM FINANCES — {currentSeason} SEASON</span>
      </div>

      {/* Market Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'MARKET SIZE',       value: MARKET_LABEL[finances.market_size] ?? finances.market_size, color: mc },
          { label: 'STADIUM CAPACITY',  value: finances.stadium_capacity.toLocaleString(), color: '#aaa' },
          { label: 'SEASON REVENUE',    value: `$${finances.season_revenue.toFixed(0)}M`, color: '#4caf50' },
          { label: 'ATTENDANCE RATE',
            value: attendancePct ? `${attendancePct}%` : 'N/A',
            color: attendancePct && attendancePct >= 80 ? '#4caf50' : attendancePct && attendancePct >= 65 ? '#FF8740' : '#e57373',
          },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 6, padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 8, color: '#444', letterSpacing: 1.5, marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
            {label === 'ATTENDANCE RATE' && estimatedAttendance && (
              <div style={{ fontSize: 10, color: '#444', marginTop: 4 }}>~{estimatedAttendance} fans/game</div>
            )}
          </div>
        ))}
      </div>

      {/* GM Personality Badge */}
      <div style={{ background: '#0d0d0d', border: `1px solid ${pmeta.color}33`, borderRadius: 6, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 9, color: '#444', letterSpacing: 1.5 }}>GM PHILOSOPHY</span>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 3,
          background: `${pmeta.color}22`, border: `1px solid ${pmeta.color}`, color: pmeta.color,
        }}>{pmeta.label.toUpperCase()}</span>
        <span style={{ fontSize: 11, color: '#555' }}>
          {gmPersonality === 'win_now'     && 'Spends aggressively on veterans. Premium on elite FAs.'}
          {gmPersonality === 'analytics'   && 'Values efficiency over star power. Patient in free agency.'}
          {gmPersonality === 'old_school'  && 'Loyal to proven players. Resigns aging veterans at a premium.'}
          {gmPersonality === 'rebuilder'   && 'Hoards picks and youth. Rarely bids on expensive FAs.'}
          {gmPersonality === 'star_chaser' && 'Will overpay for superstar talent at any cost.'}
          {gmPersonality === 'balanced'    && 'No strong inclination — reacts to team needs.'}
        </span>
      </div>

      {/* Owner Budget */}
      <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 6, padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ fontSize: 9, letterSpacing: 2, color: '#555', marginBottom: 12 }}>OWNER BUDGET</div>
        <div style={{ display: 
