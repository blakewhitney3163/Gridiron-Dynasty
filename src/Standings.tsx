import React, { useEffect, useState } from 'react';

declare const window: any;

interface Team {
  id: number;
  city: string;
  name: string;
  conference: string;
  division: string;
  wins: number;
  losses: number;
}

interface Props {
  currentSeason: number;
}

export default function Standings({ currentSeason }: Props) {
  const [standings, setStandings] = useState<Team[]>([]);
  const [viewSeason, setViewSeason] = useState<number>(currentSeason);
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);

  useEffect(() => {
    window.api.getSeasons().then((seasons: number[]) => setAvailableSeasons(seasons));
  }, []);

  useEffect(() => {
    setViewSeason(currentSeason);
  }, [currentSeason]);

  useEffect(() => {
    window.api.getStandings(viewSeason).then((data: Team[]) => {
      setStandings(data.sort((a, b) => b.wins - a.wins));
    });
  }, [viewSeason]);

  const conferences = ['AFC', 'NFC'];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ color: '#4FC3F7', margin: 0 }}>{viewSeason} Standings</h2>
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

      {conferences.map(conf => (
        <div key={conf} style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#FF8740', marginBottom: '10px', fontSize: '13px', letterSpacing: '1px' }}>{conf}</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#aaa', textAlign: 'left', borderBottom: '1px solid #333', fontSize: '12px' }}>
                <th style={{ padding: '8px' }}>Team</th>
                <th style={{ padding: '8px' }}>W</th>
                <th style={{ padding: '8px' }}>L</th>
                <th style={{ padding: '8px' }}>PCT</th>
              </tr>
            </thead>
            <tbody>
              {standings
                .filter(t => t.conference === conf)
                .map((team, i) => (
                  <tr key={team.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '8px', color: i === 0 ? '#fff' : '#ccc' }}>{team.city} {team.name}</td>
                    <td style={{ padding: '8px', color: '#4FC3F7', fontWeight: 'bold' }}>{team.wins}</td>
                    <td style={{ padding: '8px', color: '#aaa' }}>{team.losses}</td>
                    <td style={{ padding: '8px', color: '#aaa' }}>
                      {((team.wins / (team.wins + team.losses)) || 0).toFixed(3)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}