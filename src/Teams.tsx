import React, { useEffect, useState } from 'react';

declare const window: any;

interface Team {
  id: number;
  city: string;
  name: string;
  conference: string;
  division: string;
}

interface Player {
  first_name: string;
  last_name: string;
  position: string;
  overall_rating: number;
  age: number;
  speed: number;
  strength: number;
  awareness: number;
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<Player[]>([]);

  // Load all teams on mount
  useEffect(() => {
    window.api.getTeams().then((data: Team[]) => setTeams(data));
  }, []);

  // Load roster when a team is selected
  const handleSelectTeam = (team: Team) => {
    setSelectedTeam(team);
    window.api.getRoster(team.id).then((data: Player[]) => setRoster(data));
  };

  const conferences = ['AFC', 'NFC'];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 90px)' }}>

      {/* Left panel — team list */}
      <div style={{ width: '220px', background: '#0f0f23', borderRight: '1px solid #333', overflowY: 'auto' }}>
        {conferences.map(conf => (
          <div key={conf}>
            <div style={{ padding: '10px 14px', color: '#FF8740', fontWeight: 'bold', fontSize: '12px', borderBottom: '1px solid #222' }}>
              {conf}
            </div>
            {teams
              .filter(t => t.conference === conf)
              .map(team => (
                <div
                  key={team.id}
                  onClick={() => handleSelectTeam(team)}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    color: selectedTeam?.id === team.id ? '#4FC3F7' : '#ccc',
                    background: selectedTeam?.id === team.id ? '#1a1a3e' : 'transparent',
                    borderBottom: '1px solid #1a1a1a',
                    fontSize: '13px',
                  }}
                >
                  {team.city} {team.name}
                </div>
              ))}
          </div>
        ))}
      </div>

      {/* Right panel — roster */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {!selectedTeam ? (
          <div style={{ color: '#aaa', textAlign: 'center', marginTop: '60px' }}>
            <p style={{ fontSize: '18px' }}>Select a team to view their roster</p>
          </div>
        ) : (
          <>
            <h2 style={{ color: '#4FC3F7', marginBottom: '4px' }}>
              {selectedTeam.city} {selectedTeam.name}
            </h2>
            <p style={{ color: '#aaa', marginBottom: '20px' }}>
              {selectedTeam.conference} — {selectedTeam.division}
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: '#aaa', textAlign: 'left', borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '8px' }}>Name</th>
                  <th style={{ padding: '8px' }}>POS</th>
                  <th style={{ padding: '8px' }}>OVR</th>
                  <th style={{ padding: '8px' }}>Age</th>
                  <th style={{ padding: '8px' }}>SPD</th>
                  <th style={{ padding: '8px' }}>STR</th>
                  <th style={{ padding: '8px' }}>AWR</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((player, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '8px', color: '#fff' }}>{player.first_name} {player.last_name}</td>
                    <td style={{ padding: '8px', color: '#FF8740' }}>{player.position}</td>
                    <td style={{ padding: '8px', color: '#4FC3F7', fontWeight: 'bold' }}>{player.overall_rating}</td>
                    <td style={{ padding: '8px', color: '#aaa' }}>{player.age}</td>
                    <td style={{ padding: '8px', color: '#aaa' }}>{player.speed}</td>
                    <td style={{ padding: '8px', color: '#aaa' }}>{player.strength}</td>
                    <td style={{ padding: '8px', color: '#aaa' }}>{player.awareness}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}