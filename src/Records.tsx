import React, { useEffect, useState } from 'react';

declare const window: any;

type RecordMode = 'alltime' | 'season' | 'awards';
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
  pass_yards: number; pass_tds: number; interceptions: number;
  completions: number; pass_attempts: number;
  rush_yards: number; rush_tds: number; rush_attempts: number;
  rec_yards: number; rec_tds: number; receptions: number; targets: number;
  tackles: number; assisted_tackles: number; sacks: number; tfl: number;
  def_interceptions: number; pass_deflections: number; forced_fumbles: number;
}

interface RecordsData {
  passing: RecordRow[]; rushing: RecordRow[]; receiving: RecordRow[];
  tds: RecordRow[]; tackles: RecordRow[]; sacks: RecordRow[]; defInts: RecordRow[];
}

interface NflBenchmark {
  player_name: string; team_name: string; position: string; season?: number;
  games_played: number;
  pass_yards: number; pass_tds: number; interceptions: number;
  completions: number; pass_attempts: number;
  rush_yards: number; rush_tds: number; rush_attempts: number;
  rec_yards: number; rec_tds: number; receptions: number; targets: number;
  tackles: number; assisted_tackles: number; sacks: number; tfl: number;
  def_interceptions: number; pass_deflections: number; forced_fumbles: number;
}

interface AwardWinner {
  id: number; name: string; position: string; position_label: string;
  age: number; overall_rating: number; dev_trait: string;
  team_name: string; team_city: string; games: number;
  pass_yards?: number; pass_tds?: number; interceptions?: number;
  rush_yards?: number; rush_tds?: number;
  rec_yards?: number; rec_tds?: number; receptions?: number;
  tackles?: number; sacks?: number; def_interceptions?: number;
}

interface SeasonAwards {
  mvp: AwardWinner | null; opoy: AwardWinner | null; dpoy: AwardWinner | null;
  oroty: AwardWinner | null; droty: AwardWinner | null;
  coy: { city: string; name: string; wins: number } | null;
}

const NFL_BENCHMARKS: Record<'alltime' | 'season', Record<StatCategory, NflBenchmark>> = {
  alltime: {
    passing: {
      player_name: 'Tom Brady', team_name: 'NE / TB · 2000–2022', position: 'QB', games_played: 335,
      pass_yards: 89214, pass_tds: 649, interceptions: 212, completions: 7753, pass_attempts: 11317,
      rush_yards: 0, rush_tds: 0, rush_attempts: 0, rec_yards: 0, rec_tds: 0, receptions: 0, targets: 0,
      tackles: 0, assisted_tackles: 0, sacks: 0, tfl: 0, def_interceptions: 0, pass_deflections: 0, forced_fumbles: 0,
    },
    rushing: {
      player_name: 'Emmitt Smith', team_name: 'DAL / ARI · 1990–2004', position: 'RB', games_played: 226,
      rush_yards: 18355, rush_tds: 164, rush_attempts: 4409,
      pass_yards: 0, pass_tds: 0, interceptions: 0, completions: 0, pass_attempts: 0,
      rec_yards: 3224, rec_tds: 11, receptions: 515, targets: 0,
      tackles: 0, assisted_tackles: 0, sacks: 0, tfl: 0, def_interceptions: 0, pass_deflections: 0, forced_fumbles: 0,
    },
    receiving: {
      player_name: 'Jerry Rice', team_name: 'SF / OAK · 1985–2004', position: 'WR', games_played: 303,
      rec_yards: 22895, rec_tds: 197, receptions: 1549, targets: 2200,
      pass_yards: 0, pass_tds: 1, interceptions: 0, completions: 0, pass_attempts: 0,
      rush_yards: 645, rush_tds: 10, rush_attempts: 104,
      tackles: 0, assisted_tackles: 0, sacks: 0, tfl: 0, def_interceptions: 0, pass_deflections: 0, forced_fumbles: 0,
    },
    tds: {
      player_name: 'Tom Brady', team_name: 'NE / TB · 2000–2022', position: 'QB', games_played: 335,
      pass_tds: 649, rush_tds: 24, rec_tds: 0,
      pass_yards: 89214, interceptions: 212, completions: 7753, pass_attempts: 11317,
      rush_yards: 0, rush_attempts: 0, rec_yards: 0, receptions: 0, targets: 0,
      tackles: 0, assisted_tackles: 0, sacks: 0, tfl: 0, def_interceptions: 0, pass_deflections: 0, forced_fumbles: 0,
    },
    tackles: {
      player_name: 'Ray Lewis', team_name: 'BAL · 1996–2012', position: 'MLB', games_played: 228,
      tackles: 1568, assisted_tackles: 491, tfl: 90, sacks: 41,
      pass_yards: 0, pass_tds: 0, interceptions: 0, completions: 0, pass_attempts: 0,
      rush_yards: 0, rush_tds: 0, rush_attempts: 0, rec_yards: 0, rec_tds: 0, receptions: 0, targets: 0,
      def_interceptions: 0, pass_deflections: 0, forced_fumbles: 0,
    },
    sacks: {
      player_name: 'Bruce Smith', team_name: 'BUF / WAS · 1985–2003', position: 'DE', games_played: 279,
      sacks: 200, tfl: 171, forced_fumbles: 43, tackles: 1012,
      pass_yards: 0, pass_tds: 0, interceptions: 0, completions: 0, pass_attempts: 0,
      rush_yards: 0, rush_tds: 0, rush_attempts: 0, rec_yards: 0, rec_tds: 0, receptions: 0, targets: 0,
      assisted_tackles: 0, def_interceptions: 0, pass_deflections: 0,
    },
    defInts: {
      player_name: 'Paul Krause', team_name: 'WAS / MIN · 1964–1979', position: 'S', games_played: 200,
      def_interceptions: 81, pass_deflections: 81, tackles: 300,
      pass_yards: 0, pass_tds: 0, interceptions: 0, completions: 0, pass_attempts: 0,
      rush_yards: 0, rush_tds: 0, rush_attempts: 0, rec_yards: 0, rec_tds: 0, receptions: 0, targets: 0,
      assisted_tackles: 0, sacks: 0, tfl: 0, forced_fumbles: 0,
    },
  },
  season: {
    passing: {
      player_name: 'Peyton Manning', team_name: 'Denver Broncos', position: 'QB', season: 2013, games_played: 16,
      pass_yards: 5477, pass_tds: 55, interceptions: 10, completions: 450, pass_attempts: 659,
      rush_yards: 0, rush_tds: 0, rush_attempts: 0, rec_yards: 0, rec_tds: 0, receptions: 0, targets: 0,
      tackles: 0, assisted_tackles: 0, sacks: 0, tfl: 0, def_interceptions: 0, pass_deflections: 0, forced_fumbles: 0,
    },
    rushing: {
      player_name: 'Eric Dickerson', team_name: 'Los Angeles Rams', position: 'RB', season: 1984, games_played: 16,
      rush_yards: 2105, rush_tds: 14, rush_attempts: 379,
      pass_yards: 0, pass_tds: 0, interceptions: 0, completions: 0, pass_attempts: 0,
      rec_yards: 0, rec_tds: 0, receptions: 0, targets: 0,
      tackles: 0, assisted_tackles: 0, sacks: 0, tfl: 0, def_interceptions: 0, pass_deflections: 0, forced_fumbles: 0,
    },
    receiving: {
      player_name: 'Calvin Johnson', team_name: 'Detroit Lions', position: 'WR', season: 2012, games_played: 16,
      rec_yards: 1964, rec_tds: 5, receptions: 122, targets: 204,
      pass_yards: 0, pass_tds: 0, interceptions: 0, completions: 0, pass_attempts: 0,
      rush_yards: 0, rush_tds: 0, rush_attempts: 0,
      tackles: 0, assisted_tackles: 0, sacks: 0, tfl: 0, def_interceptions: 0, pass_deflections: 0, forced_fumbles: 0,
    },
    tds: {
      player_name: 'LaDainian Tomlinson', team_name: 'San Diego Chargers', position: 'RB', season: 2006, games_played: 16,
      rush_tds: 28, rec_tds: 3, pass_tds: 1,
      pass_yards: 0, interceptions: 0, completions: 0, pass_attempts: 0,
      rush_yards: 1815, rush_attempts: 348, rec_yards: 508, receptions: 56, targets: 65,
      tackles: 0, assisted_tackles: 0, sacks: 0, tfl: 0, def_interceptions: 0, pass_deflections: 0, forced_fumbles: 0,
    },
    tackles: {
      player_name: 'Darius Leonard', team_name: 'Indianapolis Colts', position: 'LB', season: 2018, games_played: 16,
      tackles: 111, assisted_tackles: 52, tfl: 16, sacks: 7,
      pass_yards: 0, pass_tds: 0, interceptions: 0, completions: 0, pass_attempts: 0,
      rush_yards: 0, rush_tds: 0, rush_attempts: 0, rec_yards: 0, rec_tds: 0, receptions: 0, targets: 0,
      def_interceptions: 3, pass_deflections: 5, forced_fumbles: 2,
    },
    sacks: {
      player_name: 'Michael Strahan', team_name: 'New York Giants', position: 'DE', season: 2001, games_played: 16,
      sacks: 22.5, tfl: 25, forced_fumbles: 4, tackles: 52,
      pass_yards: 0, pass_tds: 0, interceptions: 0, completions: 0, pass_attempts: 0,
      rush_yards: 0, rush_tds: 0, rush_attempts: 0, rec_yards: 0, rec_tds: 0, receptions: 0, targets: 0,
      assisted_tackles: 0, def_interceptions: 0, pass_deflections: 0,
    },
    defInts: {
      player_name: 'Dick "Night Train" Lane', team_name: 'Los Angeles Rams', position: 'CB', season: 1952, games_played: 12,
      def_interceptions: 14, pass_deflections: 14, tackles: 50,
      pass_yards: 0, pass_tds: 0, interceptions: 0, completions: 0, pass_attempts: 0,
      rush_yards: 0, rush_tds: 0, rush_attempts: 0, rec_yards: 0, rec_tds: 0, receptions: 0, targets: 0,
      assisted_tackles: 0, sacks: 0, tfl: 0, forced_fumbles: 0,
    },
  },
};

const TRAIT_META: Record<string, { color: string; short: string }> = {
  'Normal': { color: '#444', short: '' },
  'Star': { color: '#4FC3F7', short: 'S' },
  'Superstar': { color: '#FF8740', short: 'SS' },
  'X-Factor': { color: '#FFD700', short: 'XF' },
};

function ratingColor(r: number): string {
  if (r >= 90) return '#FFD700';
  if (r >= 80) return '#4caf50';
  if (r >= 70) return '#FF8740';
  return '#888';
}

const CATEGORIES: { id: StatCategory; label: string }[] = [
  { id: 'passing', label: 'Passing' },
  { id: 'rushing', label: 'Rushing' },
  { id: 'receiving', label: 'Receiving' },
  { id: 'tds', label: 'Touchdowns' },
  { id: 'tackles', label: 'Tackles' },
  { id: 'sacks', label: 'Sacks' },
  { id: 'defInts', label: 'INTs / PDs' },
];

type ColDef = { label: string; key: string; fmt?: (v: number) => string };

function columns(cat: StatCategory, isAlltime: boolean): ColDef[] {
  const gCol: ColDef = { label: 'G', key: 'games_played' };
  switch (cat) {
    case 'passing':
      return [gCol, { label: 'YDS', key: 'pass_yards' }, { label: 'TD', key: 'pass_tds' },
        { label: 'INT', key: 'interceptions' }, { label: 'CMP', key: 'completions' }, { label: 'ATT', key: 'pass_attempts' }];
    case 'rushing':
      return [gCol, { label: 'YDS', key: 'rush_yards' }, { label: 'TD', key: 'rush_tds' },
        { label: 'ATT', key: 'rush_attempts' }, { label: 'YPC', key: '_ypc', fmt: (v) => v.toFixed(1) }];
    case 'receiving':
      return [gCol, { label: 'YDS', key: 'rec_yards' }, { label: 'TD', key: 'rec_tds' },
        { label: 'REC', key: 'receptions' }, { label: 'TGT', key: 'targets' }];
    case 'tds':
      return [gCol, { label: 'TOT TDs', key: '_total_tds' }, { label: 'PASS TD', key: 'pass_tds' },
        { label: 'RUSH TD', key: 'rush_tds' }, { label: 'REC TD', key: 'rec_tds' }];
    case 'tackles':
      return [gCol, { label: 'SOLO', key: 'tackles' }, { label: 'ASST', key: 'assisted_tackles' },
        { label: 'TOTAL', key: '_total_tkl' }, { label: 'TFL', key: 'tfl' }, { label: 'SACKS', key: 'sacks' }];
    case 'sacks':
      return [gCol, { label: 'SACKS', key: 'sacks' }, { label: 'TFL', key: 'tfl' },
        { label: 'FF', key: 'forced_fumbles' }, { label: 'SOLO TKL', key: 'tackles' }];
    case 'defInts':
      return [gCol, { label: 'INT', key: 'def_interceptions' }, { label: 'PD', key: 'pass_deflections' },
        { label: 'DEF TD', key: '_def_tds' }, { label: 'SOLO TKL', key: 'tackles' }];
  }
}

function getValue(row: RecordRow | NflBenchmark, key: string): number {
  if (key === '_ypc') return (row as any).rush_attempts > 0 ? (row as any).rush_yards / (row as any).rush_attempts : 0;
  if (key === '_total_tds') return ((row as any).pass_tds || 0) + ((row as any).rush_tds || 0) + ((row as any).rec_tds || 0);
  if (key === '_total_tkl') return ((row as any).tackles || 0) + ((row as any).assisted_tackles || 0);
  if (key === '_def_tds') return 0;
  return (row as any)[key] ?? 0;
}

function gridTemplate(cols: ColDef[], mode: RecordMode): string {
  const seasonCol = mode === 'season' ? ' 60px' : '';
  return `30px 1fr 50px 40px ${cols.map(() => '80px').join(' ')}${seasonCol}`;
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 14px', background: 'none', border: 'none', cursor: 'pointer',
      color: active ? '#4FC3F7' : '#444',
      borderBottom: active ? '2px solid #4FC3F7' : '2px solid transparent',
      fontWeight: active ? 'bold' : 'normal',
      fontSize: 11, letterSpacing: 1, fontFamily: 'monospace',
    }}>
      {children}
    </button>
  );
}

function ModeBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 18px', background: active ? '#4FC3F7' : 'transparent',
      border: '1px solid #222', borderRadius: 4, cursor: 'pointer',
      color: active ? '#000' : '#444',
      fontWeight: active ? 'bold' : 'normal',
      fontSize: 11, letterSpacing: 2, fontFamily: 'monospace',
    }}>
      {children}
    </button>
  );
}

function BenchmarkRow({ benchmark, cols, mode }: { benchmark: NflBenchmark; cols: ColDef[]; mode: RecordMode }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: gridTemplate(cols, mode),
      alignItems: 'center', padding: '10px 0',
      background: '#1a1400', borderBottom: '1px solid #2a2000',
    }}>
      <div style={{ textAlign: 'center', fontSize: 14 }}>🏆</div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 'bold', color: '#FFD700' }}>{benchmark.player_name}</div>
        <div style={{ fontSize: 9, color: '#FF8740', letterSpacing: 1 }}>NFL RECORD</div>
        <div style={{ fontSize: 10, color: '#555' }}>{benchmark.team_name}</div>
      </div>
      <div style={{ fontSize: 11, color: '#555' }}>{benchmark.position}</div>
      <div style={{ fontSize: 11, color: '#333' }}>—</div>
      {cols.map((col) => {
        const val = getValue(benchmark, col.key);
        const formatted = col.fmt ? col.fmt(val) : (val === 0 ? '—' : val.toLocaleString());
        const isMainStat = col === cols[1];
        return (
          <div key={col.key} style={{ fontSize: 12, color: isMainStat ? '#FFD700' : '#555', fontWeight: isMainStat ? 'bold' : 'normal' }}>
            {formatted}
          </div>
        );
      })}
      {mode === 'season' && <div style={{ fontSize: 11, color: '#444' }}>{benchmark.season}</div>}
    </div>
  );
}

function StatLine({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
      <span style={{ fontSize: 10, color: '#444', letterSpacing: 1 }}>{label}</span>
      <span style={{ fontSize: 11, color: '#aaa' }}>{value ?? '—'}</span>
    </div>
  );
}

function AwardCard({ award, icon, winner, coy, type }: {
  award: string; icon: string;
  winner?: AwardWinner | null;
  coy?: { city: string; name: string; wins: number } | null;
  type: 'off' | 'def' | 'coy';
}) {
  const accent = type === 'def' ? '#4FC3F7' : type === 'coy' ? '#FF8740' : '#FFD700';
  return (
    <div style={{
      background: '#0d0d0d', borderRadius: 6, padding: '18px 20px',
      border: '1px solid #1a1a1a', borderTop: `2px solid ${accent}`,
    }}>
      <div style={{ fontSize: 10, color: accent, letterSpacing: 3, marginBottom: 14 }}>
        {icon} {award}
      </div>
      {type === 'coy' ? (
        coy ? (
          <>
            <div style={{ fontSize: 15, fontWeight: 'bold', color: '#fff', marginBottom: 4 }}>
              {coy.city} {coy.name}
            </div>
            <div style={{ fontSize: 11, color: '#555' }}>{coy.wins}–{18 - coy.wins} record</div>
          </>
        ) : <div style={{ fontSize: 12, color: '#333' }}>Season in progress</div>
      ) : winner ? (
        <>
          <div style={{ fontSize: 15, fontWeight: 'bold', color: '#fff', marginBottom: 2 }}>{winner.name}</div>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 14 }}>
            {winner.team_city} {winner.team_name} · {winner.position_label || winner.position} · {winner.games}G
          </div>
          {type === 'off' && winner.position === 'QB' && <>
            <StatLine label="PASS YDS" value={(winner.pass_yards || 0).toLocaleString()} />
            <StatLine label="TD / INT" value={`${winner.pass_tds} / ${winner.interceptions}`} />
            <StatLine label="RUSH YDS" value={winner.rush_yards} />
          </>}
          {type === 'off' && winner.position === 'RB' && <>
            <StatLine label="RUSH YDS" value={(winner.rush_yards || 0).toLocaleString()} />
            <StatLine label="RUSH TD" value={winner.rush_tds} />
            <StatLine label="REC YDS" value={winner.rec_yards} />
          </>}
          {type === 'off' && (winner.position === 'WR' || winner.position === 'TE') && <>
            <StatLine label="REC YDS" value={(winner.rec_yards || 0).toLocaleString()} />
            <StatLine label="REC TD" value={winner.rec_tds} />
            <StatLine label="RECEPTIONS" value={winner.receptions} />
          </>}
          {type === 'def' && <>
            <StatLine label="TACKLES" value={winner.tackles} />
            <StatLine label="SACKS" value={winner.sacks} />
            <StatLine label="INT" value={winner.def_interceptions} />
          </>}
          <div style={{ marginTop: 14, fontSize: 12, color: accent, fontWeight: 'bold' }}>
            {winner.overall_rating} OVR
            {winner.dev_trait && winner.dev_trait !== 'Normal' && (
              <span style={{ fontSize: 10, color: '#FF8740', marginLeft: 8 }}>{winner.dev_trait}</span>
            )}
          </div>
        </>
      ) : <div style={{ fontSize: 12, color: '#333' }}>No qualifying players</div>}
    </div>
  );
}

export default function Records() {
  const [mode, setMode] = useState<RecordMode>('alltime');
  const [category, setCategory] = useState<StatCategory>('passing');
  const [alltime, setAlltime] = useState<RecordsData | null>(null);
  const [season, setSeason] = useState<RecordsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [awards, setAwards] = useState<SeasonAwards | null>(null);
  const [currentSeason, setCurrentSeason] = useState(2025);

  useEffect(() => {
    Promise.all([
      window.api.getAlltimeLeaders(),
      window.api.getSeasonRecords(),
      window.api.getCurrentSeason(),
    ]).then(([at, sr, s]: [RecordsData, RecordsData, number]) => {
      setAlltime(at);
      setSeason(sr);
      setCurrentSeason(s);
      setLoading(false);
      window.api.getSeasonAwards(s).then((aw: SeasonAwards) => setAwards(aw));
    });
  }, []);

  const data = mode === 'alltime' ? alltime : season;
  const rows: RecordRow[] = data ? (data[category] ?? []) : [];
  const cols = columns(category, mode === 'alltime');
  const benchmark = mode !== 'awards' ? NFL_BENCHMARKS[mode][category] : null;

  return (
    <div style={{ fontFamily: 'monospace', color: '#ccc', maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 }}>Historical Records</div>
        <div style={{ fontSize: 11, color: '#444' }}>
          In-game leaders · gold row shows the real NFL record to beat
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <ModeBtn active={mode === 'alltime'} onClick={() => setMode('alltime')}>ALL-TIME LEADERS</ModeBtn>
        <ModeBtn active={mode === 'season'} onClick={() => setMode('season')}>SEASON RECORDS</ModeBtn>
        <ModeBtn active={mode === 'awards'} onClick={() => setMode('awards')}>SEASON AWARDS</ModeBtn>
      </div>

      {/* Category tabs — hidden in awards mode */}
      {mode !== 'awards' && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #111', paddingBottom: 4 }}>
          {CATEGORIES.map(c => (
            <TabBtn key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
              {c.label.toUpperCase()}
            </TabBtn>
          ))}
        </div>
      )}

      {/* Awards mode */}
      {mode === 'awards' && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 10, color: '#444', letterSpacing: 3, marginBottom: 20 }}>
            {currentSeason} SEASON AWARDS
          </div>
          {!awards?.mvp && !awards?.dpoy ? (
            <div style={{ color: '#333', fontSize: 13, fontStyle: 'italic' }}>
              No awards yet — simulate the full regular season first.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <AwardCard award="MVP" icon="🏆" winner={awards?.mvp} type="off" />
              <AwardCard award="OFF. PLAYER OF THE YEAR" icon="⚡" winner={awards?.opoy} type="off" />
              <AwardCard award="DEF. PLAYER OF THE YEAR" icon="🛡" winner={awards?.dpoy} type="def" />
              <AwardCard award="OFF. ROOKIE OF THE YEAR" icon="🌟" winner={awards?.oroty} type="off" />
              <AwardCard award="DEF. ROOKIE OF THE YEAR" icon="🌟" winner={awards?.droty} type="def" />
              <AwardCard award="COACH OF THE YEAR" icon="📋" coy={awards?.coy} type="coy" />
            </div>
          )}
        </div>
      )}

      {/* Leaderboard — hidden in awards mode */}
      {mode !== 'awards' && (
        loading ? (
          <div style={{ color: '#333', padding: 40 }}>Loading records…</div>
        ) : (
          <>
            {/* Column header row */}
            <div style={{
              display: 'grid', gridTemplateColumns: gridTemplate(cols, mode),
              padding: '6px 0', borderBottom: '1px solid #111',
              fontSize: 10, color: '#333', letterSpacing: 1,
            }}>
              <div>#</div>
              <div>PLAYER</div>
              <div>POS</div>
              <div>OVR</div>
              {cols.map(c => <div key={c.key}>{c.label}</div>)}
              {mode === 'season' && <div>SEASON</div>}
            </div>

            {/* NFL benchmark row */}
            {benchmark && <BenchmarkRow benchmark={benchmark} cols={cols} mode={mode} />}

            {/* In-game player rows */}
            {rows.length === 0 ? (
              <div style={{ color: '#333', padding: '24px 0', fontSize: 13, fontStyle: 'italic' }}>
                No in-game records yet — simulate some games first.
              </div>
            ) : (
              rows.map((row, idx) => {
                const trait = TRAIT_META[row.dev_trait] ?? TRAIT_META['Normal'];
                return (
                  <div key={row.player_id} style={{
                    display: 'grid', gridTemplateColumns: gridTemplate(cols, mode),
                    alignItems: 'center', padding: '9px 0',
                    borderBottom: '1px solid #0d0d0d',
                    background: idx % 2 === 0 ? 'transparent' : '#080808',
                  }}>
                    <div style={{ fontSize: 11, color: '#333' }}>{idx + 1}</div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 'bold', color: '#ddd' }}>{row.player_name}</span>
                        {trait.short && (
                          <span style={{ fontSize: 9, color: trait.color, fontWeight: 'bold' }}>{trait.short}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: '#444' }}>{row.team_name}</div>
                    </div>
                    <div style={{ fontSize: 11, color: '#555' }}>{row.position}</div>
                    <div style={{ fontSize: 12, color: ratingColor(row.overall_rating), fontWeight: 'bold' }}>
                      {row.overall_rating}
                    </div>
                    {cols.map(col => {
                      const val = getValue(row, col.key);
                      const formatted = col.fmt ? col.fmt(val) : val.toLocaleString();
                      const isMainStat = col === cols[1];
                      return (
                        <div key={col.key} style={{
                          fontSize: 12,
                          color: isMainStat ? '#4FC3F7' : '#666',
                          fontWeight: isMainStat ? 'bold' : 'normal',
                        }}>
                          {formatted}
                        </div>
                      );
                    })}
                    {mode === 'season' && (
                      <div style={{ fontSize: 11, color: '#444' }}>{row.season}</div>
                    )}
                  </div>
                );
              })
            )}

            <div style={{ fontSize: 10, color: '#222', marginTop: 16, letterSpacing: 1 }}>
              {rows.length} player{rows.length !== 1 ? 's' : ''} · {mode === 'alltime' ? 'career totals' : 'single-season bests'} from all simulated games
            </div>
          </>
        )
      )}
    </div>
  );
}