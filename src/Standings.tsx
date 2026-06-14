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

export default function Standings() {
  const [standings, setStandings] = useState<Team[]>([]);

  useEffect(() => {
    window.api.getStandings(2025).then((data: Team[]) => {
      setStandings(data.sort((a, b) => b.wins - a.wins));
    });
  }, []);

  const conferences = ["AFC", "NFC"];

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a2e', minHeight: '100vh', color: '#fff' }}>
      <h2 style={{ color: '#4FC3F7', marginBottom: '20px' }}>2025 Standings</h2>
      {conferences.map(conf => (
        <div key={conf} style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#FF8740', borderBottom: '1px solid #444', paddingBottom: '5px' }}>{conf}</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#aaa', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>Team</th>
                <th style={{ padding: '8px' }}>W</th>
                <th style={{ padding: '8px' }}>L</th>
                <th style={{ padding: '8px' }}>PCT</th>
              </tr>
            </thead>
            <tbody>
              {standings
                .filter(t => t.conference === conf)
                .map(team => (
                  <tr key={team.id} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '8px', color: '#fff' }}>{team.city} {team.name}</td>
                    <td style={{ padding: '8px', color: '#4FC3F7' }}>{team.wins}</td>
                    <td style={{ padding: '8px', color: '#EF5350' }}>{team.losses}</td>
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