import React, { useEffect, useState } from 'react';
import { T } from './theme';

declare const window: any;

interface Game {
  id: number;
  week: number;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
}

interface BoxScoreGame {
  id: number; week: number;
  home_team: string; away_team: string;
  home_team_id: number; away_team_id: number;
  home_score: number; away_score: number;
  home_q1: number; home_q2: number; home_q3: number; home_q4: number;
  away_q1: number; away_q2: number; away_q3: number; away_q4: number;
}

interface BoxScorePlayer {
  player_name: string; position: string; team_id: number;
  pass_attempts: number; completions: number; pass_yards: number; pass_tds: number; interceptions: number;
  rush_attempts: number; rush_yards: number; rush_tds: number;
  receptions: number; rec_yards: number; rec_tds: number; targets: number;
  tackles: number; assisted_tackles: number; sacks: number; tfl: number;
  def_interceptions: number; pass_deflections: number;
}

interface Props { currentSeason: number; }

function BoxScoreModal({ gameId, onClose }: { gameId: number; onClose: () => void }) {
  const [data, setData] = useState<{ game: BoxScoreGame; players: BoxScorePlayer[] } | null>(null);

  useEffect(() => {
    window.api.getGameBoxScore(gameId).then((d: any) => setData(d));
  }, [gameId]);

  if (!data) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: T.bgPanel, borderRadius: 8, padding: 32, color: T.textDim }}>Loading...</div>
    </div>
  );

  const { game, players } = data;
  const homePlayers = players.filter(p => p.team_id === game.home_team_id);
  const awayPlayers = players.filter(p => p.team_id === game.away_team_id);

  const topPasser  = (pl: BoxScorePlayer[]) => pl.filter(p => (p.pass_attempts ?? 0) > 0).sort((a, b) => b.pass_yards - a.pass_yards)[0];
  const topRusher  = (pl: BoxScorePlayer[]) => pl.filter(p => (p.rush_attempts ?? 0) > 0).sort((a, b) => b.rush_yards - a.rush_yards)[0];
  const topReceiver = (pl: BoxScorePlayer[]) => pl.filter(p => (p.receptions ?? 0) > 0).sort((a, b) => b.rec_yards - a.rec_yards)[0];
  const topDefender = (pl: BoxScorePlayer[]) => pl.filter(p => ((p.tackles ?? 0) + (p.assisted_tackles ?? 0)) > 0 || (p.sacks ?? 0) > 0).sort((a, b) => ((b.tackles ?? 0) + (b.assisted_tackles ?? 0)) - ((a.tackles ?? 0) + (a.assisted_tackles ?? 0)))[0];

  const homeWon = game.home_score > game.away_score;

  const thSt: React.CSSProperties = { padding: '6px 12px', color: T.textDim, fontSize: 10, letterSpacing: 1, fontWeight: 600, textAlign: 'right' };
  const tdSt: React.CSSProperties = { padding: '6px 12px', fontFamily: 'monospace', fontSize: 13, textAlign: 'right' };

  const StatRow = ({ label, away, home }: { label: string; away: React.ReactNode; home: React.ReactNode }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, padding: '5px 0', borderBottom: `1px solid ${T.borderFaint}`, alignItems: 'center' }}>
      <div style={{ textAlign: 'right', fontSize: 12, color: T.textPrimary }}>{away}</div>
      <div style={{ fontSize: 10, color: T.textDim, letterSpacing: 1, textAlign: 'center', minWidth: 80 }}>{label}</div>
      <div style={{ textAlign: 'left', fontSize: 12, color: T.textPrimary }}>{home}</div>
    </div>
  );

  const passerLine = (p: BoxScorePlayer | undefined) => p
    ? `${p.player_name.split(' ')[1] ?? p.player_name} ${p.completions}/${p.pass_attempts} ${p.pass_yards} yds ${p.pass_tds} TD`
    : '—';
  const rusherLine = (p: BoxScorePlayer | undefined) => p
    ? `${p.player_name.split(' ')[1] ?? p.player_name} ${p.rush_attempts} car ${p.rush_yards} yds`
    : '—';
  const receiverLine = (p: BoxScorePlayer | undefined) => p
    ? `${p.player_name.split(' ')[1] ?? p.player_name} ${p.receptions} rec ${p.rec_yards} yds`
    : '—';
  const defenderLine = (p: BoxScorePlayer | undefined) => p
    ? `${p.player_name.split(' ')[1] ?? p.player_name} ${(p.tackles ?? 0) + (p.assisted_tackles ?? 0)} tkl${p.sacks > 0 ? ` ${p.sacks} sck` : ''}`
    : '—';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bgPanel, border: `1px solid ${T.borderMid}`, borderRadius: 10, padding: 0, width: 520, maxHeight: '85vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.borderFaint}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: T.textDim, letterSpacing: 1 }}>WEEK {game.week} BOX SCORE</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.textMuted, fontSize: 18, cursor: 'pointer' }}>×</button>
        </div>

        {/* Quarter Score Table */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.borderFaint}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thSt, textAlign: 'left', width: '40%' }}>TEAM</th>
                <th style={thSt}>Q1</th>
                <th style={thSt}>Q2</th>
                <th style={thSt}>Q3</th>
                <th style={thSt}>Q4</th>
                <th style={{ ...thSt, color: T.textPrimary, fontSize: 12 }}>F</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderTop: `1px solid ${T.borderFaint}` }}>
                <td style={{ ...tdSt, textAlign: 'left', color: homeWon ? T.textDim : '#4FC3F7', fontWeight: homeWon ? 400 : 700 }}>{game.away_team}</td>
                <td style={{ ...tdSt, color: T.textMuted }}>{game.away_q1 ?? 0}</td>
                <td style={{ ...tdSt, color: T.textMuted }}>{game.away_q2 ?? 0}</td>
                <td style={{ ...tdSt, color: T.textMuted }}>{game.away_q3 ?? 0}</td>
                <td style={{ ...tdSt, color: T.textMuted }}>{game.away_q4 ?? 0}</td>
                <td style={{ ...tdSt, fontWeight: 'bold', fontSize: 15, color: homeWon ? T.textMuted : '#4FC3F7' }}>{game.away_score}</td>
              </tr>
              <tr style={{ borderTop: `1px solid ${T.borderFaint}` }}>
                <td style={{ ...tdSt, textAlign: 'left', color: homeWon ? '#4FC3F7' : T.textDim, fontWeight: homeWon ? 700 : 400 }}>{game.home_team}</td>
                <td style={{ ...tdSt, color: T.textMuted }}>{game.home_q1 ?? 0}</td>
                <td style={{ ...tdSt, color: T.textMuted }}>{game.home_q2 ?? 0}</td>
                <td style={{ ...tdSt, color: T.textMuted }}>{game.home_q3 ?? 0}</td>
                <td style={{ ...tdSt, color: T.textMuted }}>{game.home_q4 ?? 0}</td>
                <td style={{ ...tdSt, fontWeight: 'bold', fontSize: 15, color: homeWon ? '#4FC3F7' : T.textMuted }}>{game.home_score}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Key Stats */}
        <div style={{ padding: '14px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, marginBottom: 8 }}>
            <div style={{ textAlign: 'right', fontSize: 11, color: T.textDim, fontWeight: 600 }}>{game.away_team}</div>
            <div style={{ minWidth: 80 }} />
            <div style={{ textAlign: 'left', fontSize: 11, color: T.textDim, fontWeight: 600 }}>{game.home_team}</div>
          </div>
          <StatRow label="PASSING"   away={passerLine(topPasser(awayPlayers))}   home={passerLine(topPasser(homePlayers))} />
          <StatRow label="RUSHING"   away={rusherLine(topRusher(awayPlayers))}   home={rusherLine(topRusher(homePlayers))} />
          <StatRow label="RECEIVING" away={receiverLine(topReceiver(awayPlayers))} home={receiverLine(topReceiver(homePlayers))} />
          <StatRow label="DEFENSE"   away={defenderLine(topDefender(awayPlayers))} home={defenderLine(topDefender(homePlayers))} />
        </div>
      </div>
    </div>
  );
}

export default function Schedule({ currentSeason }: Props) {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

  useEffect(() => {
    window.api.getSchedule(currentSeason).then((data: Game[]) => setGames(data));
  }, [currentSeason]);

  const weeks = Array.from({ length: 17 }, (_, i) => i + 1);
  const weekGames = games.filter(g => g.week === selectedWeek);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 90px)' }}>

      {selectedGameId && (
        <BoxScoreModal gameId={selectedGameId} onClose={() => setSelectedGameId(null)} />
      )}

      {/* Week selector */}
      <div style={{ width: '140px', background: T.bgPanel, borderRight: `1px solid ${T.borderStrong}`, overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '10px 14px', color: '#FF8740', fontWeight: 'bold', fontSize: '12px', borderBottom: `1px solid ${T.borderFaint}` }}>
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
              fontSize: '14px',
              fontWeight: selectedWeek === week ? 'bold' : 'normal',
            }}
          >
            Week {week}
            {week === 8 && (
              <span style={{ display: 'block', fontSize: 8, color: '#FF8740', letterSpacing: 0.5, marginTop: 1 }}>DEADLINE</span>
            )}
          </div>
        ))}
      </div>

      {/* Games */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ color: '#4FC3F7', marginBottom: '16px' }}>{currentSeason} — Week {selectedWeek} Results</h2>
        {weekGames.length === 0 ? (
          <p style={{ color: T.textMuted }}>No games found for this week.</p>
        ) : (
          weekGames.map(game => {
            const homeWon = game.home_score > game.away_score;
            return (
              <div
                key={game.id}
                onClick={() => setSelectedGameId(game.id)}
                style={{
                  background: T.bgPanel, border: `1px solid ${T.borderFaint}`, borderRadius: '8px',
                  padding: '14px 18px', marginBottom: '10px', display: 'flex', alignItems: 'center',
                  gap: '16px', cursor: 'pointer', transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderMid)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = T.borderFaint)}
              >
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <span style={{ color: homeWon ? '#fff' : T.textMuted, fontSize: '14px' }}>{game.home_team}</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: '80px', justifyContent: 'center' }}>
                  <span style={{ color: homeWon ? '#4FC3F7' : T.textSecondary, fontWeight: 'bold', fontSize: '18px' }}>{game.home_score}</span>
                  <span style={{ color: T.textDim, fontSize: '12px' }}>vs</span>
                  <span style={{ color: !homeWon ? '#4FC3F7' : T.textSecondary, fontWeight: 'bold', fontSize: '18px' }}>{game.away_score}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ color: !homeWon ? '#fff' : T.textMuted, fontSize: '14px' }}>{game.away_team}</span>
                </div>
                <div style={{ fontSize: 10, color: T.textDim, letterSpacing: 0.5 }}>BOX SCORE →</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
