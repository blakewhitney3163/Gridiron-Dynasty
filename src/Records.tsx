import React, { useEffect, useState } from 'react';
import { T } from './theme';
import { RecordMode, StatCategory, RecordsData, SeasonAwards, HofEntry } from './records/types';
import { CATEGORIES, columns } from './records/recordsUtils';
import HallOfFame from './records/HallOfFame';
import AwardsView from './records/AwardsView';
import LeaderboardTable from './records/LeaderboardTable';
import { useGameStore } from './store/gameStore';

declare const window: any;

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 16px',
        fontSize: 11,
        letterSpacing: 1,
        cursor: 'pointer',
        borderRadius: 4,
        background: active ? '#FF8740' : '#111',
        border: `1px solid ${active ? '#FF8740' : '#222'}`,
        color: active ? '#000' : '#555',
        fontWeight: active ? 'bold' : 'normal',
      }}
    >
      {children}
    </button>
  );
}

export default function Records() {
  const { currentSeason } = useGameStore();
  const [mode, setMode] = useState<RecordMode>('alltime');
  const [category, setCategory] = useState<StatCategory>('passing');
  const [alltime, setAlltime] = useState<RecordsData | null>(null);
  const [season, setSeason] = useState<RecordsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [awards, setAwards] = useState<SeasonAwards | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [hofData, setHofData] = useState<HofEntry[]>([]);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      window.api.getAlltimeLeaders(),
      window.api.getSeasonRecords(),
    ]).then(([at, sr]: [RecordsData, RecordsData]) => {
      setAlltime(at); setSeason(sr); setLoading(false);
      window.api.getSeasonAwards(currentSeason).then((aw: SeasonAwards) => setAwards(aw));
      window.api.getHallOfFame().then((hof: HofEntry[]) => setHofData(hof));
    }).catch(() => setLoading(false));
  }, [currentSeason]);

  const data = mode === 'alltime' ? alltime : season;
  const rows = data ? (data[category] ?? []) : [];
  const cols = columns(category);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const handleImport = async (type: 'alltime' | 'season') => {
    setImportMsg(null);
    const result = await window.api.importHistoricalRecords(type);
    if (result.success) {
      setImportMsg(`✓ ${result.imported} records imported`);
      const [at, sr] = await Promise.all([
        window.api.getAlltimeLeaders(),
        window.api.getSeasonRecords(),
      ]);
      setAlltime(at); setSeason(sr);
    } else {
      setImportMsg(result.reason === 'Cancelled' ? null : `✗ ${result.reason}`);
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: 'monospace' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: T.textPrimary, letterSpacing: 2 }}>
          Historical Records
        </div>
        <div style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>
          Dynasty records — set by your in-game players as history is made
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <TabBtn active={mode === 'alltime'} onClick={() => setMode('alltime')}>ALL-TIME LEADERS</TabBtn>
        <TabBtn active={mode === 'season'} onClick={() => setMode('season')}>SEASON RECORDS</TabBtn>
        <TabBtn active={mode === 'awards'} onClick={() => setMode('awards')}>SEASON AWARDS</TabBtn>
        <TabBtn active={mode === 'hof'} onClick={() => setMode('hof')}>HALL OF FAME</TabBtn>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {importMsg && (
            <span style={{ fontSize: 11, color: importMsg.startsWith('✓') ? '#4caf50' : '#e57373', fontFamily: 'monospace' }}>
              {importMsg}
            </span>
          )}
          <button
            onClick={() => handleImport('alltime')}
            style={{ padding: '4px 12px', fontSize: 10, fontWeight: 700, borderRadius: 4,
              cursor: 'pointer', background: '#111', border: '1px solid #333', color: '#666', letterSpacing: 1 }}
          >
            IMPORT ALL-TIME
          </button>
          <button
            onClick={() => handleImport('season')}
            style={{ padding: '4px 12px', fontSize: 10, fontWeight: 700, borderRadius: 4,
              cursor: 'pointer', background: '#111', border: '1px solid #333', color: '#666', letterSpacing: 1 }}
          >
            IMPORT SEASON
          </button>
        </div>
      </div>

      {mode === 'hof' && <HallOfFame data={hofData} />}

      {mode !== 'awards' && mode !== 'hof' && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              style={{
                padding: '4px 10px', fontSize: 10, fontWeight: 700, borderRadius: 4, cursor: 'pointer',
                background: category === c.id ? '#FF8740' : '#111',
                border: `1px solid ${category === c.id ? '#FF8740' : '#222'}`,
                color: category === c.id ? '#000' : '#666',
              }}
            >
              {c.label.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {mode === 'awards' && <AwardsView awards={awards} season={currentSeason} />}

      {mode !== 'awards' && mode !== 'hof' && (
        <LeaderboardTable
          rows={rows}
          cols={cols}
          mode={mode}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          loading={loading}
        />
      )}
    </div>
  );
}
