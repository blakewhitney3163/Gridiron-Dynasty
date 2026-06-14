import React, { useEffect, useState } from 'react';

declare const window: any;

type StatCategory = 'passing' | 'rushing' | 'receiving';

interface PassingLeader {
  player_name: string; team_name: string;
  pass_yards: number; pass_tds: number; interceptions: number;
  completions: number; pass_attempts: number;
}
interface RushingLeader {
  player_name: string; team_name: string;
  rush_yards: number; rush_tds: number; rush_attempts: number;
}
interface ReceivingLeader {
  player_name: string; team_name: string;
  rec_yards: number; rec_tds: number; receptions: number; targets: number;
}
interface StatsData {
  passing: PassingLeader[];
  rushing: RushingLeader[];
  receiving: ReceivingLeader[];
}

interface Props {
  currentSeason: number;
}

export default function Stats({ currentSeason }: Props) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [category, setCategory] = useState<StatCategory>('passing');
  const [viewSeason, setViewSeason] = useState<number>(currentSeason);
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);

  useEffect(() => {
    window.api.getSeasons().then((seasons: number[]) => setAvailableSeasons(seasons));
  }, []);

  useEffect(() => {
    setViewSeason(currentSeason);
  }, [currentSeason]);

  useEffect(() => {
    window.api.getStats(viewSeason).then((data: StatsData) => setStats(data));
  }, [viewSeason]);

  if (!stats) return <div style={{ padding: '40px', color: '#aaa' }}>Loading...</div>;

  const categories: { id: StatCategory; label: string }[] = [
    { id: 'passing', label: 'Passing' },
    { id: 'rushing', label: 'Rushing' },
    { id: 'receiving', label: 'Receiving' },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ color: '#4FC3F7', margin: 0 }}>{viewSeason} Season Leaders</h2>
        {availableSeasons.length > 1 && (
          <select
            value={viewSeason}
            onChange={e => setViewSeason(Number(e.target.value))}
            style={{
              background: '#0f0f23', color: '#4FC3F7', border: '1px solid #333',
              borderRadius: '4px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer',
            }}
          >
            {availableSeasons.map(s => (
              <option key={s} value={s}>{s} Season</option>
            ))}
          </select>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            style={{
              padding: '8px 20px',
              background: category === cat.id ? '#4FC3F7' : '#0f0f23',
              color: category === cat.id ? '#000' : '#aaa',
              border: '1px solid #333', borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: category === cat.id ? 'bold' : 'normal',
              fontSize: '13px',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {category === 'passing' && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: '#aaa', textAlign: 'left', borderBottom: '1px solid #333', fontSize: '12px' }}>
              <th style={{ padding: '8px' }}>#</th>
              <th style={{ padding: '8px' }}>Player</th>
              <th style={{ padding: '8px' }}>Team</th>
              <th style={{ padding: '8px' }}>YDS</th>
              <th style={{ padding: '8px' }}>TD</th>
              <th style={{ padding: '8px' }}>INT</th>
              <th style={{ padding: '8px' }}>CMP</th>
              <th style={{ padding: '8px' }}>ATT</th>
              <th style={{ padding: '8px' }}>PCT</th>
            </tr>
          </thead>
          <tbody>
            {stats.passing.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td style={{ padding: '8px', color: '#555' }}>{i + 1}</td>
                <td style={{ padding: '8px', color: '#fff', fontWeight: 'bold' }}>{p.player_name}</td>
                <td style={{ padding: '8px', color: '#aaa' }}>{p.team_name}</td>
                <td style={{ padding: '8px', color: '#4FC3F7', fontWeight: 'bold' }}>{p.pass_yards}</td>
                <td style={{ padding: '8px', color: '#81C784' }}>{p.pass_tds}</td>
                <td style={{ padding: '8px', color: '#e57373' }}>{p.interceptions}</td>
                <td style={{ padding: '8px', color: '#aaa' }}>{p.completions}</td>
                <td style={{ padding: '8px', color: '#aaa' }}>{p.pass_attempts}</td>
                <td style={{ padding: '8px', color: '#aaa' }}>
                  {p.pass_attempts > 0 ? ((p.completions / p.pass_attempts) * 100).toFixed(1) + '%' : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {category === 'rushing' && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: '#aaa', textAlign: 'left', borderBottom: '1px solid #333', fontSize: '12px' }}>
              <th style={{ padding: '8px' }}>#</th>
              <th style={{ padding: '8px' }}>Player</th>
              <th style={{ padding: '8px' }}>Team</th>
              <th style={{ padding: '8px' }}>YDS</th>
              <th style={{ padding: '8px' }}>TD</th>
              <th style={{ padding: '8px' }}>ATT</th>
              <th style={{ padding: '8px' }}>YPC</th>
            </tr>
          </thead>
          <tbody>
            {stats.rushing.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td style={{ padding: '8px', color: '#555' }}>{i + 1}</td>
                <td style={{ padding: '8px', color: '#fff', fontWeight: 'bold' }}>{p.player_name}</td>
                <td style={{ padding: '8px', color: '#aaa' }}>{p.team_name}</td>
                <td style={{ padding: '8px', color: '#4FC3F7', fontWeight: 'bold' }}>{p.rush_yards}</td>
                <td style={{ padding: '8px', color: '#81C784' }}>{p.rush_tds}</td>
                <td style={{ padding: '8px', color: '#aaa' }}>{p.rush_attempts}</td>
                <td style={{ padding: '8px', color: '#aaa' }}>
                  {p.rush_attempts > 0 ? (p.rush_yards / p.rush_attempts).toFixed(1) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {category === 'receiving' && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: '#aaa', textAlign: 'left', borderBottom: '1px solid #333', fontSize: '12px' }}>
              <th style={{ padding: '8px' }}>#</th>
              <th style={{ padding: '8px' }}>Player</th>
              <th style={{ padding: '8px' }}>Team</th>
              <th style={{ padding: '8px' }}>YDS</th>
              <th style={{ padding: '8px' }}>TD</th>
              <th style={{ padding: '8px' }}>REC</th>
              <th style={{ padding: '8px' }}>TGT</th>
              <th style={{ padding: '8px' }}>YPR</th>
            </tr>
          </thead>
          <tbody>
            {stats.receiving.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td style={{ padding: '8px', color: '#555' }}>{i + 1}</td>
                <td style={{ padding: '8px', color: '#fff', fontWeight: 'bold' }}>{p.player_name}</td>
                <td style={{ padding: '8px', color: '#aaa' }}>{p.team_name}</td>
                <td style={{ padding: '8px', color: '#4FC3F7', fontWeight: 'bold' }}>{p.rec_yards}</td>
                <td style={{ padding: '8px', color: '#81C784' }}>{p.rec_tds}</td>
                <td style={{ padding: '8px', color: '#aaa' }}>{p.receptions}</td>
                <td style={{ padding: '8px', color: '#aaa' }}>{p.targets}</td>
                <td style={{ padding: '8px', color: '#aaa' }}>
                  {p.receptions > 0 ? (p.rec_yards / p.receptions).toFixed(1) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}