import React, { useEffect, useState } from 'react';
import { T } from '../theme';
import { BoxScoreGame, BoxScorePlayer } from './types';

declare const window: any;

interface Props {
  gameId: number;
  onClose: () => void;
}

const thSt: React.CSSProperties = { padding: '6px 12px', color: T.textDim, fontSize: 10, letterSpacing: 1, fontWeight: 600, textAlign: 'right' };
const tdSt: React.CSSProperties = { padding: '6px 12px', fontFamily: 'monospace', fontSize: 13, textAlign: 'right' };

function StatRow({ label, away, home }: { label: string; away: React.ReactNode; home: React.ReactNode }) {
  return (
    <tr>
      <td style={{ ...tdSt, color: T.textMuted, textAlign: 'left' }}>{away}</td>
      <td style={{ ...thSt, textAlign: 'center' }}>{label}</td>
      <td style={{ ...tdSt, color: T.textMuted, textAlign: 'right' }}>{home}</td>
    </tr>
  );
}

function topPasser(pl: BoxScorePlayer[])  { return pl.filter(p => (p.pass_attempts ?? 0) > 0).sort((a, b) => b.pass_yards - a.pass_yards)[0]; }
function topRusher(pl: BoxScorePlayer[])  { return pl.filter(p => (p.rush_attempts ?? 0) > 0).sort((a, b) => b.rush_yards - a.rush_yards)[0]; }
function topReceiver(pl: BoxScorePlayer[]) { return pl.filter(p => (p.receptions ?? 0) > 0).sort((a, b) => b.rec_yards - a.rec_yards)[0]; }
function topDefender(pl: BoxScorePlayer[]) {
  return pl
    .filter(p => ((p.tackles ?? 0) + (p.assisted_tackles ?? 0)) > 0 || (p.sacks ?? 0) > 0)
    .sort((a, b) => ((b.tackles ?? 0) + (b.assisted_tackles ?? 0)) - ((a.tackles ?? 0) + (a.assisted_tackles ?? 0)))[0];
}

function lastName(p: BoxScorePlayer) { return p.player_name.split(' ')[1] ?? p.player_name; }

function passerLine(p: BoxScorePlayer | undefined)   { return p ? `${lastName(p)} ${p.completions}/${p.pass_attempts} ${p.pass_yards} yds ${p.pass_tds} TD` : '—'; }
function rusherLine(p: BoxScorePlayer | undefined)   { return p ? `${lastName(p)} ${p.rush_attempts} car ${p.rush_yards} yds` : '—'; }
function receiverLine(p: BoxScorePlayer | undefined) { return p ? `${lastName(p)} ${p.receptions} rec ${p.rec_yards} yds` : '—'; }
function defenderLine(p: BoxScorePlayer | undefined) {
  return p ? `${lastName(p)} ${(p.tackles ?? 0) + (p.assisted_tackles ?? 0)} tkl${p.sacks > 0 ? ` ${p.sacks} sck` : ''}` : '—';
}
function topKicker(pl: BoxScorePlayer[]) {
  return pl.filter(p => (p.fg_att ?? 0) > 0).sort((a, b) => (b.fg_made ?? 0) - (a.fg_made ?? 0))[0];
}
function kickerLine(p: BoxScorePlayer | undefined) {
  if (!p) return '—';
  const parts: string[] = [lastName(p)];
  if (p.fg_att) parts.push(`${p.fg_made}/${p.fg_att} FG`);
  if (p.xp_att) parts.push(`${p.xp_made}/${p.xp_att} XP`);
  return parts.join(' ');
}

export default function BoxScoreModal({ gameId, onClose }: Props) {
  const [data, setData] = useState<{ game: BoxScoreGame; players: BoxScorePlayer[] } | null>(null);

  useEffect(() => {
    window.api.getGameBoxScore(gameId).then((d: any) => setData(d));
  }, [gameId]);

  if (!data) return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 100 }}>
      <div style={{ color: T.textDim, fontSize: 14 }}>Loading...</div>
    </div>
  );

  const { game, players } = data;
  const homePlayers = players.filter(p => p.team_id === game.home_team_id);
  const awayPlayers = players.filter(p => p.team_id === game.away_team_id);
  const homeWon = game.home_score > game.away_score;

  const quarters: (keyof BoxScoreGame)[] = ['home_q1', 'home_q2', 'home_q3', 'home_q4'];

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 100 }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        background: T.bgPanel, border: `1px solid ${T.borderMid}`,
        borderRadius: 10, padding: 0, width: 520, maxHeight: '85vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${T.borderFaint}` }}>
          <span style={{ color: T.textDim, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>WEEK {game.week} BOX SCORE</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.textDim, fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* Quarter Score Table */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.borderFaint}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thSt, textAlign: 'left' }}>TEAM</th>
                {['Q1','Q2','Q3','Q4','F'].map(h => <th key={h} style={thSt}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                { team: game.away_team, score: game.away_score, q: [game.away_q1, game.away_q2, game.away_q3, game.away_q4], won: !homeWon },
                { team: game.home_team, score: game.home_score, q: [game.home_q1, game.home_q2, game.home_q3, game.home_q4], won: homeWon },
              ].map(({ team, score, q, won }) => (
                <tr key={team}>
                  <td style={{ ...tdSt, textAlign: 'left', color: won ? T.textPrimary : T.textMuted, fontWeight: won ? 700 : 400 }}>{team}</td>
                  {q.map((v, i) => <td key={i} style={{ ...tdSt, color: T.textMuted }}>{v ?? 0}</td>)}
                  <td style={{ ...tdSt, color: won ? '#4caf50' : T.textMuted, fontWeight: 700 }}>{score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Key Stats */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 4, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: T.textMuted, fontSize: 11, fontWeight: 700 }}>{game.away_team}</span>
            <span style={{ color: T.textDim, fontSize: 9, letterSpacing: 1 }}>KEY STATS</span>
            <span style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textAlign: 'right' }}>{game.home_team}</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            
