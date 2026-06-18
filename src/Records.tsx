import React, { useEffect, useState } from 'react';
import { RecordMode, StatCategory, RecordsData, SeasonAwards, HofEntry } from './records/types';
import { CATEGORIES, columns } from './records/recordsUtils';
import HallOfFame from './records/HallOfFame';
import AwardsView from './records/AwardsView';
import LeaderboardTable from './records/LeaderboardTable';

declare const window: any;

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 14px', fontSize: 11, fontWeight: 700, borderRadius: 4, cursor: 'pointer',
      background: active ? '#222' : 'transparent',
      border: `1px solid ${active ? '#444' : 'transparent'}`,
      color: active ? '#fff' : '#555',
    }}>
      {children}
    </button>
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
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [hofData, setHofData] = useState<HofEntry[]>([]);

  useEffect(() => {
    Promise.all([
      window.api.getAlltimeLeaders(),
      window.api.getSeasonRecords(),
      window.api.getCurrentSeason(),
    ]).then(([at, sr, s]: [RecordsData, RecordsData, number]) => {
      setAlltime(at); setSeason(sr); setCurrentSeason(s); setLoading(false);
      window.api.getSeasonAwards(s).then((aw: SeasonAwards) => setAwards(aw));
      window.api.getHallOfFame().then((hof: HofEntry[]) => setHofData(hof));
    }).catch(() => setLoading(false));
  }, []);

  const data = mode === 'alltime' ? alltime : season;
  const rows = data ? (data[category] ?? []) : [];
  const cols = columns(category);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Historical Records</h1>
        <p style={{ color: '#555', fontSize: 12, margin: 0 }}>
          In-game leaders · gold rows are real NFL records to beat
        </p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #1a1a1a', paddingBottom: 10 }}>
        <TabBtn active={mode === 'alltime'} onClick={() => setMode('alltime')}>ALL-TIME LEADERS</TabBtn>
        <TabBtn active={mode === 'season'}  onClick={() => setMode('season')}>SEASON RECORDS</TabBtn>
        <TabBtn active={mode === 'awards'}  onClick={() => setMode('awards')}>SEASON AWARDS</TabBtn>
        <TabBtn active={mode === 'hof'}     onClick={() => setMode('hof')}>HALL OF FAME</TabBtn>
      </div>

      {mode === 'hof' && <HallOfFame hofData={hofData} />}

      {mode !== 'awards' && mode !== 'hof' && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)} style={{
              padding: '4px 10px', fontSize: 10, fontWeight: 700, borderRadius: 4, cursor: 'pointer',
              background: category === c.id ? '#FF8740' : '#111',
              border: `1px solid ${category === c.id ? '#FF8740' : '#222'}`,
              color: category === c.id ? '#000' : '#666',
            }}>
              {c.label.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {mode === 'awards' && <AwardsView currentSeason={currentSeason} awards={awards} />}

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
