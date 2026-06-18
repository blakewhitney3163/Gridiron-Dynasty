import React, { useEffect, useState } from 'react';
import { T } from './theme';
import { Team } from './standings/types';
import { DIVISION_ORDER, pct, getPlayoffSeeds } from './standings/standingsUtils';
import DivisionBlock from './standings/DivisionBlock';
import PlayoffSeedPanel from './standings/PlayoffSeedPanel';

declare const window: any;

interface Props {
  currentSeason: number;
}

export default function Standings({ currentSeason }: Props) {
  const [standings, setStandings] = useState<Team[]>([]);
  const [viewSeason, setViewSeason] = useState(currentSeason);
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);
  const [userTeamId, setUserTeamId] = useState<number | undefined>();
  const [view, setView] = useState<'division' | 'conference'>('division');

  useEffect(() => {
    window.api.getSeasons().then((seasons: number[]) => setAvailableSeasons(seasons));
    window.api.getUserTeam().then((t: any) => { if (t) setUserTeamId(t.id); });
  }, []);

  useEffect(() => { setViewSeason(currentSeason); }, [currentSeason]);

  useEffect(() => {
    window.api.getStandings(viewSeason).then((data: Team[]) => setStandings(data));
  }, [viewSeason]);

  const afcSeeds   = getPlayoffSeeds(standings, 'AFC');
  const nfcSeeds   = getPlayoffSeeds(standings, 'NFC');
  const playoffIds = new Set([...afcSeeds, ...nfcSeeds].map(t => t.id));

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ color: T.textPrimary, fontSize: 22, fontWeight: 700, margin: 0 }}>{viewSeason} Standings</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {(['division', 'conference'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '5px 14px',
                background: view === v ? T.bgGreen : 'transparent', border: 'none',
                color: view === v ? '#4caf50' : T.textDim,
                cursor: 'pointer', fontSize: 11, fontFamily: 'monospace',
                fontWeight: view === v ? 'bold' : 'normal',
              }}>
                {v === 'division' ? 'By Division' : 'By Conference'}
              </button>
            ))}
          </div>
          {availableSeasons.length > 1 && (
            <select value={viewSeason} onChange={e => setViewSeason(Number(e.target.value))} style={{
              background: T.bgPage, color: T.textPrimary, border: `1px solid ${T.borderFaint}`,
              borderRadius: 4, padding: '5px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'monospace',
            }}>
              {availableSeasons.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
      </div>

      {view === 'division' ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            {(['AFC', 'NFC'] as const).map(conf => (
              <div key={conf}>
                <div style={{ color: T.textDim, fontSize: 10, letterSpacing: 2, fontWeight: 700, marginBottom: 12 }}>{conf}</div>
                {DIVISION_ORDER.map(div => {
                  const divTeams = standings.filter(t => t.conference === conf && t.division === div);
                  if (divTeams.length === 0) return null;
                  return <DivisionBlock key={div} conf={conf} division={div} teams={divTeams} userTeamId={userTeamId} playoffIds={playoffIds} />;
                })}
              </div>
            ))}
          </div>

          <div>
            <div style={{ color: T.textDim, fontSize: 10, letterSpacing: 2, fontWeight: 700, marginBottom: 12 }}>PLAYOFF PICTURE</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 10 }}>
              <PlayoffSeedPanel seeds={afcSeeds} conf="AFC" />
              <PlayoffSeedPanel seeds={nfcSeeds} conf="NFC" />
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 10, color: T.textDim }}>
              <span><span style={{ color: '#FF8740' }}>■</span> Orange = division winner (seeds 1–4)</span>
              <span><span style={{ color: '#4FC3F7' }}>■</span> Blue = wildcard (seeds 5–7)</span>
              <span>■ Seed 1 receives bye week</span>
            </div>
          </div>
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {(['AFC', 'NFC'] as const).map(conf => {
            const seeds = conf === 'AFC' ? afcSeeds : nfcSeeds;
            const confTeams = standings
              .filter(t => t.conference === conf)
              .sort((a, b) => b.wins - a.wins || a.losses - b.losses);
            const cutlineIdx = 7;

            return (
              <div key={conf}>
                <div style={{ color: T.textDim, fontSize: 10, letterSpacing: 2, fontWeight: 700, marginBottom: 12 }}>{conf}</div>
                <div style={{ background: T.bgCard, border: `1px solid ${T.borderFaint}`, borderRadius: 6, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: T.bgPanel }}>
                        {['', 'TEAM', 'W', 'L', 'PCT', 'DIV'].map(h => (
                          <th key={h} style={{ padding: '6px 8px', fontSize: 9, color: T.textDim, letterSpacing: 1, fontWeight: 700, textAlign: h === 'TEAM' ? 'left' : 'right' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {confTeams.map((team, i) => {
                        const seedNum = seeds.findIndex(s => s.id === team.id) + 1;
                        const isDivWinner = seedNum >= 1 && seedNum <= 4;
                        const isUser = team.id === userTeamId;
                        const isCutline = i === cutlineIdx;

                        return (
                          <React.Fragment key={team.id}>
                            {isCutline && (
                              <tr>
                                <td colSpan={6} style={{ padding: '4px 10px', fontSize: 9, color: T.textDim, letterSpacing: 1, background: T.bgPanel, textAlign: 'center', borderTop: `1px solid ${T.borderFaint}` }}>
                                  — playoff cutline (after seed 7) —
                                </td>
                              </tr>
                            )}
                            <tr style={{ background: isUser ? T.bgBlue : 'transparent', borderTop: `1px solid ${T.borderFaint}` }}>
                              <td style={{ padding: '6px 8px', textAlign: 'center', width: 28 }}>
                                {seedNum > 0 && (
                                  <span style={{ color: isDivWinner ? '#FF8740' : '#4FC3F7', fontWeight: 700, fontSize: 12 }}>{seedNum}</span>
                                )}
                              </td>
                              <td style={{ padding: '6px 8px', fontSize: 12 }}>
                                <span style={{ color: isUser ? '#4FC3F7' : T.textPrimary, fontWeight: isUser ? 700 : 400 }}>
                                  {team.city} {team.name}
                                </span>
                                {isUser && <span style={{ color: '#4FC3F7', fontSize: 10, marginLeft: 4 }}>◆</span>}
                              </td>
                              <td style={{ padding: '6px 8px', fontSize: 12, color: T.textMuted, textAlign: 'right' }}>{team.wins}</td>
                              <td style={{ padding: '6px 8px', fontSize: 12, color: T.textMuted, textAlign: 'right' }}>{team.losses}</td>
                              <td style={{ padding: '6px 8px', fontSize: 12, color: T.textMuted, textAlign: 'right' }}>{pct(team.wins, team.losses)}</td>
                              <td style={{ padding: '6px 8px', fontSize: 11, color: T.textDim, textAlign: 'right' }}>{team.division}</td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
