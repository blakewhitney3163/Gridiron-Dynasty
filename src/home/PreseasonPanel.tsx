import React, { useState } from 'react';

declare const window: any;

interface PreseasonGame {
  id: number;
  week: number;
  home_team_id: number;
  away_team_id: number;
  home_city: string; home_name: string; home_abbr: string;
  away_city: string; away_name: string; away_abbr: string;
  home_score: number;
  away_score: number;
  is_simulated: number;
}

interface PreseasonStatus {
  generated: boolean;
  done: boolean;
  weeksDone: number[];
  games: PreseasonGame[];
}

interface Props {
  status: PreseasonStatus;
  userTeamId: number | null;
  currentSeason: number;
  onStatusChange: (s: PreseasonStatus) => void;
  onStartSeason: () => void;
}

// Solid palette — no transparent overlays
const C = {
  panelBg:    '#1e3a5f',   // bright dark navy — main panel
  weekBase:   '#243f62',   // week block base
  weekActive: '#2a4a72',   // active week — noticeably lighter
  weekDone:   '#1e3d2e',   // completed week — green-tinted navy
  gameBg:     '#1a3354',   // user game card
  textPrimary:'#f0f4f8',
  textSub:    '#9ab0c8',
  textDim:    '#6a86a0',
  orange:     '#fb923c',
  green:      '#4ade80',
  border:     '#2e5080',
  borderActive:'#fb923c',
  borderDone: '#2d6a4f',
};

const btn = (s: React.CSSProperties): React.CSSProperties => ({
  border: 'none', borderRadius: 5, cursor: 'pointer',
  fontFamily: 'inherit', fontWeight: 600, ...s,
});

export default function PreseasonPanel({ status, userTeamId, currentSeason, onStatusChange, onStartSeason }: Props) {
  const [generating, setGenerating] = useState(false);
  const [simming, setSimming] = useState<number | null>(null);
  const [startingSeason, setStartingSeason] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    await window.api.generatePreseason(currentSeason);
    const fresh = await window.api.getPreseasonStatus(currentSeason);
    onStatusChange(fresh);
    setGenerating(false);
  };

  const handleSimWeek = async (week: number) => {
    setSimming(week);
    await window.api.simulatePreseasonWeek(week, currentSeason);
    const fresh = await window.api.getPreseasonStatus(currentSeason);
    onStatusChange(fresh);
    setSimming(null);
  };

  const handleSimGame = async (gameId: number) => {
    setSimming(-1);
    await window.api.simulatePreseasonGame(gameId);
    const fresh = await window.api.getPreseasonStatus(currentSeason);
    onStatusChange(fresh);
    setSimming(null);
  };

  const handleStartSeason = async () => {
    setStartingSeason(true);
    try { await onStartSeason(); } finally { setStartingSeason(false); }
  };

  if (!status.generated) {
    return (
      <div style={{ background: C.panelBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '24px 28px', marginBottom: 16 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: C.textDim, marginBottom: 6, fontWeight: 700 }}>PRESEASON {currentSeason}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, marginBottom: 8 }}>Ready for preseason?</div>
        <div style={{ fontSize: 13, color: C.textSub, marginBottom: 22, lineHeight: 1.6 }}>
          Play 4 exhibition weeks before the regular season. Sim them all, play individually, or skip entirely.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleGenerate} disabled={generating}
            style={btn({ padding: '10px 22px', fontSize: 13, background: C.orange, color: '#000', opacity: generating ? 0.6 : 1 })}>
            {generating ? 'Generating...' : 'Generate Preseason Schedule'}
          </button>
          <button onClick={onStartSeason}
            style={btn({ padding: '10px 18px', fontSize: 13, background: 'transparent', color: C.textSub, border: `1px solid ${C.border}` })}>
            Skip Preseason
          </button>
        </div>
      </div>
    );
  }

  const gamesByWeek = [1, 2, 3, 4].map(w => ({
    week: w,
    games: status.games.filter(g => g.week === w),
    done: status.weeksDone.includes(w),
  }));

  return (
    <div style={{ background: C.panelBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '24px 28px', marginBottom: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 2, color: C.textDim, marginBottom: 4, fontWeight: 700 }}>PRESEASON {currentSeason}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
            {status.done ? 'Preseason Complete' : `Week ${status.weeksDone.length + 1} of 4`}
          </div>
          <div style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>{status.weeksDone.length} / 4 weeks complete</div>
        </div>
        {status.done && (
          <button onClick={handleStartSeason} disabled={startingSeason}
            style={btn({ padding: '11px 24px', fontSize: 13, background: C.green, color: '#000', opacity: startingSeason ? 0.6 : 1 })}>
            {startingSeason ? 'Starting...' : 'Start Regular Season'}
          </button>
        )}
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        {[1, 2, 3, 4].map(w => {
          const done = status.weeksDone.includes(w);
          const active = !done && status.weeksDone.length === w - 1;
          return (
            <React.Fragment key={w}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, flexShrink: 0,
                background: done ? C.green : active ? C.orange : C.weekBase,
                color: done || active ? '#000' : C.textDim,
                border: `2px solid ${done ? C.green : active ? C.orange : C.border}`,
              }}>
                {done ? '✓' : w}
              </div>
              {w < 4 && <div style={{ flex: 1, height: 2, maxWidth: 44, background: done ? C.green : C.border, borderRadius: 1 }} />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Week blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {gamesByWeek.map(({ week, games, done }) => {
          const userGame = games.find(g => g.home_team_id === userTeamId || g.away_team_id === userTeamId);
          const isActive = !done && status.weeksDone.length === week - 1;
          const pending = games.filter(g => !g.is_simulated).length;
          const isSimming = simming === week;

          return (
            <div key={week} style={{
              padding: '12px 16px', borderRadius: 8,
              background: done ? C.weekDone : isActive ? C.weekActive : C.weekBase,
              border: `1px solid ${done ? C.borderDone : isActive ? C.borderActive : C.border}`,
              opacity: !done && !isActive ? 0.65 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                    color: done ? C.green : isActive ? C.orange : C.textSub }}>
                    PRESEASON WEEK {week}
                  </span>
                  <span style={{ fontSize: 11, color: C.textDim }}>
                    {done ? `${games.length} games complete` : `${pending} remaining`}
                  </span>
                </div>
                {isActive && (
                  <button onClick={() => handleSimWeek(week)} disabled={!!simming}
                    style={btn({ padding: '5px 14px', fontSize: 11, background: C.weekBase,
                      border: `1px solid ${C.green}`, color: C.green, opacity: simming ? 0.5 : 1 })}>
                    {isSimming ? 'Simming...' : 'Sim Week'}
                  </button>
                )}
              </div>

              {userGame && isActive && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginTop: 10, padding: '10px 14px',
                  background: C.gameBg, border: `1px solid ${C.orange}55`, borderRadius: 6,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, color: C.orange, fontWeight: 700 }}>{userGame.away_abbr}</span>
                    <span style={{ fontSize: 12, color: C.textDim }}>@</span>
                    <span style={{ fontSize: 14, color: C.orange, fontWeight: 700 }}>{userGame.home_abbr}</span>
                    <span style={{ fontSize: 10, color: C.textDim, letterSpacing: 0.5 }}>YOUR GAME</span>
                  </div>
                  {!userGame.is_simulated ? (
                    <button onClick={() => handleSimGame(userGame.id)} disabled={!!simming}
                      style={btn({ padding: '6px 18px', fontSize: 12, background: C.orange, color: '#000', opacity: simming ? 0.5 : 1 })}>
                      Sim Game
                    </button>
                  ) : (
                    <span style={{ fontSize: 14, color: C.green, fontWeight: 700 }}>
                      {userGame.home_score} – {userGame.away_score}
                    </span>
                  )}
                </div>
              )}

              {done && userGame && (
                <div style={{ fontSize: 12, color: C.textSub, marginTop: 8 }}>
                  Your result: <strong style={{ color: C.textPrimary }}>
                    {userGame.away_abbr} {userGame.away_score} @ {userGame.home_abbr} {userGame.home_score}
                  </strong>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!status.done && (
        <button onClick={onStartSeason}
          style={btn({ marginTop: 14, padding: '7px 16px', fontSize: 12,
            background: 'transparent', color: C.textSub, border: `1px solid ${C.border}` })}>
          Skip remaining preseason
        </button>
      )}
    </div>
  );
}
