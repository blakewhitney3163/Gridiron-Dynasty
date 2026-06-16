import React, { useEffect, useState } from 'react';

declare const window: any;

type RecordMode = 'alltime' | 'season';
type StatCategory = 'passing' | 'rushing' | 'receiving' | 'tds' | 'tackles' | 'sacks' | 'defInts';

interface RecordRow {
  player_id: number;
  player_name: string;
  position: string;
  team_name: string;
  age: number;
  overall_rating: number;
  dev_trait: string;
  season?: number;
  games_played: number;
  seasons_played?: number;
  pass_yards: number;
  pass_tds: number;
  interceptions: number;
  completions: number;
  pass_attempts: number;
  rush_yards: number;
  rush_tds: number;
  rush_attempts: number;
  rec_yards: number;
  rec_tds: number;
  receptions: number;
  targets: number;
  tackles: number;
  assisted_tackles: number;
  sacks: number;
  tfl: number;
  def_interceptions: number;
  pass_deflections: number;
  forced_fumbles: number;
}

interface RecordsData {
  passing: RecordRow[];
  rushing: RecordRow[];
  receiving: RecordRow[];
  tds: RecordRow[];
  tackles: RecordRow[];
  sacks: RecordRow[];
  defInts: RecordRow[];
}

const TRAIT_META: Record<string, { color: string; short: string }> = {
  'Normal':    { color: '#444',    short: '' },
  'Star':      { color: '#4FC3F7', short: 'S' },
  'Superstar': { color: '#FF8740', short: 'SS' },
  'X-Factor':  { color: '#FFD700', short: 'XF' },
};

function ratingColor(r: number): string {
  if (r >= 90) return '#FFD700';
  if (r >= 80) return '#4caf50';
  if (r >= 70) return '#FF8740';
  return '#888';
}

const CATEGORIES: { id: StatCategory; label: string }[] = [
  { id: 'passing',   label: 'Passing' },
  { id: 'rushing',   label: 'Rushing' },
  { id: 'receiving', label: 'Receiving' },
  { id: 'tds',       label: 'Touchdowns' },
  { id: 'tackles',   label: 'Tackles' },
  { id: 'sacks',     label: 'Sacks' },
  { id: 'defInts',   label: 'INTs / PDs' },
];

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 14px', fontSize: 11, letterSpacing: 1, cursor: 'pointer', borderRadius: 4,
      background: active ? '#4FC3F7' : '#141414',
      border: `1px solid ${active ? '#4FC3F7' : '#222'}`,
      color: active ? '#000' : '#555',
      fontWeight: active ? 'bold' : 'normal',
    }}>{children}</button>
  );
}

function ModeBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 18px', fontSize: 11, letterSpacing: 1, cursor: 'pointer', borderRadius: 4,
      background: active ? '#FF8740' : '#111',
      border: `1px solid ${active ? '#FF8740' : '#222'}`,
      color: active ? '#000' : '#555',
      fontWeight: active ? 'bold' : 'normal',
    }}>{children}</button>
  );
}

function columns(cat: StatCategory, isAlltime: boolean): { label: string; key: string; fmt?: (v: number) => string }[] {
  const gCol = isAlltime
    ? { label: 'G', key: 'games_played' }
    : { label: 'G', key: 'games_played' };

  switch (cat) {
    case 'passing':
      return [gCol, { label: 'YDS', key: 'pass_yards' }, { label: 'TD', key: 'pass_tds' }, { label: 'INT', key: 'interceptions' }, { label: 'CMP', key: 'completions' }, { label: 'ATT', key: 'pass_attempts' }];
    case 'rushing':
      return [gCol, { label: 'YDS', key: 'rush_yards' }, { label: 'TD', key: 'rush_tds' }, { label: 'ATT', key: 'rush_attempts' }, { label: 'YPC', key: '_ypc', fmt: (v) => v.toFixed(1) }];
    case 'receiving':
      return [gCol, { label: 'YDS', key: 'rec_yards' }, { label: 'TD', key: 'rec_tds' }, { label: 'REC', key: 'receptions' }, { label: 'TGT', key: 'targets' }];
    case 'tds':
      return [gCol, { label: 'TOT TDs', key: '_total_tds' }, { label: 'PASS TD', key: 'pass_tds' }, { label: 'RUSH TD', key: 'rush_tds' }, { label: 'REC TD', key: 'rec_tds' }];
    case 'tackles':
      return [gCol, { label: 'SOLO', key: 'tackles' }, { label: 'ASST', key: 'assisted_tackles' }, { label: 'TOTAL', key: '_total_tkl' }, { label: 'TFL', key: 'tfl' }, { label: 'SACKS', key: 'sacks' }];
    case 'sacks':
      return [gCol, { label: 'SACKS', key: 'sacks' }, { label: 'TFL', key: 'tfl' }, { label: 'FF', key: 'forced_fumbles' }, { label: 'SOLO TKL', key: 'tackles' }];
    case 'defInts':
      return [gCol, { label: 'INT', key: 'def_interceptions' }, { label: 'PD', key: 'pass_deflections' }, { label: 'DEF TD', key: '_def_tds' }, { label: 'SOLO TKL', key: 'tackles' }];
  }
}

function getValue(row: RecordRow, key: string): number {
  if (key === '_ypc') return row.rush_attempts > 0 ? row.rush_yards / row.rush_attempts : 0;
  if (key === '_total_tds') return (row.pass_tds || 0) + (row.rush_tds || 0) + (row.rec_tds || 0);
  if (key === '_total_tkl') return (row.tackles || 0) + (row.assisted_tackles || 0);
  if (key === '_def_tds') return 0;
  return (row as any)[key] ?? 0;
}

export default function Records() {
  const [mode,     setMode]     = useState<RecordMode>('alltime');
  const [category, setCategory] = useState<StatCategory>('passing');
  const [alltime,  setAlltime]  = useState<RecordsData | null>(null);
  const [season,   setSeason]   = useState<RecordsData | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      window.api.getAlltimeLeaders(),
      window.api.getSeasonRecords(),
    ]).then(([at, sr]: [RecordsData, RecordsData]) => {
      setAlltime(at);
      setSeason(sr);
      setLoading(false);
    });
  }, []);

  const data = mode === 'alltime' ? alltime : season;
  const rows: RecordRow[] = data ? (data[category] ?? []) : [];
  const cols = columns(category, mode === 'alltime');

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'monospace', color: '#ccc', background: '#0d0d0d', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: '#fff', letterSpacing: 1 }}>Historical Records</div>
        <div style={{ fontSize: 12, color: '#555', marginTop: 3 }}>All-time leaders and single-season records from simulated games</div>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <ModeBtn active={mode === 'alltime'} onClick={() => setMode('alltime')}>ALL-TIME LEADERS</ModeBtn>
        <ModeBtn active={mode === 'season'}  onClick={() => setMode('season')}>SEASON RECORDS</ModeBtn>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {CATEGORIES.map(c => (
          <TabBtn key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>{c.label.toUpperCase()}</TabBtn>
        ))}
      </div>

      {loading ? (
        <div style={{ color: '#333', padding: 40, textAlign: 'center' }}>Loading records...</div>
      ) : rows.length === 0 ? (
        <div style={{ color: '#333', padding: 40, textAlign: 'center' }}>
          No records yet — simulate some games first.
        </div>
      ) : (
        <>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `30px 2fr 90px 80px ${cols.map(() => '80px').join(' ')}`,
            gap: 8, padding: '6px 12px',
            fontSize: 10, color: '#333', letterSpacing: 1,
            borderBottom: '1px solid #1a1a1a', marginBottom: 4,
          }}>
            <span>#</span>
            <span>PLAYER</span>
            <span>POS</span>
            <span>OVR</span>
            {cols.map(c => <span key={c.key}>{c.label}</span>)}
            {mode === 'season' && <span>SEASON</span>}
          </div>

          {/* Rows */}
          {rows.map((row, idx) => {
            const trait = TRAIT_META[row.dev_trait] ?? TRAIT_META['Normal'];
            return (
              <div key={`${row.player_id}-${row.season ?? 'all'}`} style={{
                display: 'grid',
                gridTemplateColumns: `30px 2fr 90px 80px ${cols.map(() => '80px').join(' ')}`,
                gap: 8, padding: '8px 12px',
                borderBottom: '1px solid #111',
                background: idx === 0 ? '#0f0e00' : 'transparent',
              }}>
                {/* Rank */}
                <div style={{ fontSize: 12, color: idx === 0 ? '#FFD700' : idx < 3 ? '#FF8740' : '#333', fontWeight: 'bold' }}>
                  {idx + 1}
                </div>

                {/* Player */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ color: idx === 0 ? '#FFD700' : '#ddd', fontWeight: idx < 3 ? 'bold' : 'normal', fontSize: 13 }}>
                      {row.player_name}
                    </span>
                    {trait.short && (
                      <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: trait.color + '22', color: trait.color, fontWeight: 'bold', letterSpacing: 1 }}>
                        {trait.short}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: '#444', marginTop: 1 }}>{row.team_name}</div>
                </div>

                {/* Position */}
                <div style={{ fontSize: 12, color: '#555' }}>{row.position}</div>

                {/* OVR */}
                <div style={{ fontSize: 12, fontWeight: 'bold', color: ratingColor(row.overall_rating) }}>
                  {row.overall_rating}
                </div>

                {/* Stat columns */}
                {cols.map(col => {
                  const val = getValue(row, col.key);
                  const formatted = col.fmt ? col.fmt(val) : val.toLocaleString();
                  const isMainStat = col === cols[1];
                  return (
                    <div key={col.key} style={{
                      fontSize: isMainStat ? 14 : 12,
                      fontWeight: isMainStat ? 'bold' : 'normal',
                      color: isMainStat ? (idx === 0 ? '#FFD700' : '#ccc') : '#555',
                    }}>
                      {formatted}
                    </div>
                  );
                })}

                {/* Season (season records mode) */}
                {mode === 'season' && (
                  <div style={{ fontSize: 12, color: '#555' }}>{row.season}</div>
                )}
              </div>
            );
          })}

          <div style={{ marginTop: 12, fontSize: 11, color: '#333', textAlign: 'right' }}>
            {rows.length} player{rows.length !== 1 ? 's' : ''} · {mode === 'alltime' ? 'career totals' : 'single-season bests'} from all simulated games
          </div>
        </>
      )}
    </div>
  );
}