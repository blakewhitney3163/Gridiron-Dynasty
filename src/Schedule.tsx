import React, { useEffect, useState } from 'react';

declare const window: any;

interface Game {
  id: number;
  week: number;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
}

export default function Schedule() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  useEffect(() => {
    window.api.getSchedule(2024).then((data: Game[]) => setGames(data));
  }, []);

  const weeks = Array.from({ length: 17 }, (_, i) => i + 1);
  const weekGames = games.filter(g => g.week === selectedWeek);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 90px)' }}>

      {/* Left panel — week selector */}
      <div style={{ width: '100px', background: '#0f0f23', borderRight: '1px solid #333', overflowY: 'auto' }}>
        <div style={{ padding: '10px 14px', color: '#FF8740', fontWeight: 'bold', fontSize: '12px', borderBottom: '1px solid #222' }}>
          WEEK
        </div>
        {weeks.map(week => (
          <div
            key={week}
            onClick={() => setSelectedWeek(week)}
            style={{
              padding: '10px 14px',
              cursor: 'pointer',
              color: selectedWeek === week ? '#4FC3F7' : '#ccc',
              background: selectedWeek === week ? '#1a1a3e' : 'transparent',
              borderBottom: '1px solid #1a1a1a',
              fontSize: '14px',
              fontWeight: selectedWeek === week ? 'bold' : 'normal',
            }}
          >
            Week {week}
          </div>
        ))}
      </div>

      {/* Right panel — games for selected week */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <h2 style={{ color: '#4FC3F7', marginBottom: '20px' }}>Week {selectedWeek} Results</h2>
        {weekGames.length === 0 ? (
          <p style={{ color: '#aaa' }}>No games found for this week.</p>
        ) : (
          weekGames.map(game => {
            const homeWon = game.home_score > game.away_score;
            return (
              <div
                key={game.id}
                style={{
                  background: '#0f0f23',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  padding: '14px 20px',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ color: homeWon ? '#fff' : '#666', fontWeight: homeWon ? 'bold' : 'normal', width: '200px' }}>
                  {game.home_team}
                </span>
                <span style={{ color: homeWon ? '#4FC3F7' : '#aaa', fontSize: '20px', fontWeight: 'bold', width: '40px', textAlign: 'center' }}>
                  {game.home_score}
                </span>
                <span style={{ color: '#555', fontSize: '12px', width: '30px', textAlign: 'center' }}>vs</span>
                <span style={{ color: !homeWon ? '#4FC3F7' : '#aaa', fontSize: '20px', fontWeight: 'bold', width: '40px', textAlign: 'center' }}>
                  {game.away_score}
                </span>
                <span style={{ color: !homeWon ? '#fff' : '#666', fontWeight: !homeWon ? 'bold' : 'normal', width: '200px', textAlign: 'right' }}>
                  {game.away_team}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}