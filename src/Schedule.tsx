import React, { useEffect, useState } from 'react';
import { T } from './theme';
import { Game } from './schedule/types';
import BoxScoreModal from './schedule/BoxScoreModal';
import { useGameStore } from './store/gameStore';

declare const window: any;

export default function Schedule() {
  const { currentSeason } = useGameStore();
  const [games, setGames]               = useState<Game[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

  useEffect(() => {
    window.api.getSchedule(currentSeason).then((data: Game[]) => setGames(data));
  }, [currentSeason]);

  const weeks     = Array.from({ length: 17 }, (_, i) => i + 1);
  const weekGames = games.filter(g => g.week === selectedWeek);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {selectedGameId && (
        <BoxScoreModal gameId={selectedGameId} onClose={() => setSelectedGameId(null)} />
      )}

      {/* Week selector */}
      <div style={{ width: 140, flexShrink: 0, overflowY: 'auto', borderRight: `1px solid ${T.borderFaint}` }}>
        <div style={{ padding: '8px 14px', fontSize: 9, fontWeight: 700, letterSpacing: 1, color: T.textDim, background: T.bgPanel, borderBottom: `1px solid ${T.borderFaint}` }}>
          WEEK
        </div>
        {weeks.map(week => (
          <div
            key={week}
            onClick={() => setSelectedWeek(week)}
            style={{
              padding: '10px 14px', cursor: 'pointer',
              color: selectedWeek === week ? '#4FC3F7' : T.textPrimary,
              background: selectedWeek === week ? T.bgBlue : 'transparent',
              borderBottom: `1px solid ${T.borderFaint}`,
              fontSize: '14px', fontWeight: selectedWeek === week ? 'bold' : 'normal',
            }}
          >
            Week {week}
            {week === 8 && (
              <span style={{ color: '#FF8740', fontSize: 8, fontWeight: 700, marginLeft: 6 }}>DEADLINE</span>
            )}
          </div>
        ))}
      </div>

      {/* Games list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        <div style={{ color: T.textDim, fontSize: 10, letterSpacing: 1, fontWeight: 700, marginBottom: 16 }}>
          {currentSeason} — Week {selectedWeek} Results
        </div>
        {weekGames.length === 0 ? (
          <div style={{ color: T.textDim, fontSize: 13 }}>No games found for this week.</div>
        ) : (
          weekGames.map(game => {
            const homeWon = game.home_score > game.away_score;
            return (
              <div
                key={game.id}
                onClick={() => setSelectedGameId(game.id)}
                style={{
                  background: T.bgPanel, border: `1px solid ${T.borderFaint}`, borderRadius: 8,
                  padding: '14px 18px', marginBottom: 10, display: 'flex', alignItems: 'center',
                  gap: 16, cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderMid)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = T.borderFaint)}
              >
                <span style={{ color: homeWon ? T.textPrimary : T.textMuted, fontWeight: homeWon ? 700 : 400, minWidth: 140 }}>
                  {game.home_team}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: homeWon ? '#4caf50' : T.textMuted, fontWeight: 700, fontSize: 18, minWidth: 28, textAlign: 'right' }}>
                    {game.home_score}
                  </span>
                  <span style={{ color: T.textDim, fontSize: 11 }}>vs</span>
                  <span style={{ color: !homeWon ? '#4caf50' : T.textMuted, fontWeight: 700, fontSize: 18, minWidth: 28 }}>
                    {game.away_score}
                  </span>
                </div>
                <span style={{ color: !homeWon ? T.textPrimary : T.textMuted, fontWeight: !homeWon ? 700 : 400, flex: 1 }}>
                  {game.away_team}
                </span>
                <span style={{ color: T.textDim, fontSize: 11 }}>BOX SCORE →</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
