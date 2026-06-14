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

interface Props {
  currentSeason: number;
}

export default function Schedule({ currentSeason }: Props) {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  useEffect(() => {
    window.api.getSchedule(currentSeason).then((data: Game[]) => setGames(data));
  }, [currentSeason]);

  const weeks = Array.from({ length: 17 }, (_, i) => i + 1);
  const weekGames = games.filter(g => g.week === selectedWeek);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 90px)' }}>

      {/* Week selector */}
      <div style={{ width: '140px', background: '#0f0f23', borderRight: '1px solid #333', overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '10px 14px', color: '#FF8740', fontWeight: 'bold', fontSize: '12px', borderBottom: '1px solid #222' }}>
          WEEK
        </div>
        {weeks.map(week => (
          <div
            key={week}
            onClick={() => setSelectedWeek(week)}
            style={{
              padding: '10px 14px', cursor: 'pointer',
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

      {/* Games */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ color: '#4FC3F7', marginBottom: '16px' }}>{currentSeason} — Week {selectedWeek} Results</h2>
        {weekGames.length === 0 ? (
          <p style={{ color: '#555' }}>No games found for this week.</p>
        ) : (
          weekGames.map(game => {
            const homeWon = game.home_score > game.away_score;
            return (
              <div key={game.id} style={{ background: '#0f0f23', border: '1px solid #222', borderRadius: '8px', padding: '14px 18px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <span style={{ color: homeWon ? '#fff' : '#666', fontSize: '14px' }}>{game.home_team}</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: '80px', justifyContent: 'center' }}>
                  <span style={{ color: homeWon ? '#4FC3F7' : '#aaa', fontWeight: 'bold', fontSize: '18px' }}>{game.home_score}</span>
                  <span style={{ color: '#444', fontSize: '12px' }}>vs</span>
                  <span style={{ color: !homeWon ? '#4FC3F7' : '#aaa', fontWeight: 'bold', fontSize: '18px' }}>{game.away_score}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ color: !homeWon ? '#fff' : '#666', fontSize: '14px' }}>{game.away_team}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}