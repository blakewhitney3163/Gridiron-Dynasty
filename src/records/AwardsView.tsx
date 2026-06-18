import React from 'react';
import { AwardWinner, SeasonAwards } from './types';
import { ratingColor } from './recordsUtils';

function StatLine({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: '#ccc', fontWeight: 700, fontSize: 13 }}>{value ?? '—'}</span>
      <span style={{ color: '#555', fontSize: 11 }}>{label}</span>
    </div>
  );
}

function AwardCard({ award, icon, winner, coy, type }: {
  award: string; icon: string;
  winner?: AwardWinner | null;
  coy?: { city: string; name: string; wins: number } | null;
  type: 'off' | 'def' | 'coy';
}) {
  const accent = type === 'def' ? '#4FC3F7' : type === 'coy' ? '#FF8740' : '#FFD700';
  return (
    <div style={{
      background: '#1a1a1a', border: `1px solid ${accent}33`,
      borderRadius: 8, padding: '14px 16px', minWidth: 200, flex: 1,
    }}>
      <div style={{ color: accent, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>
        {icon} {award}
      </div>
      {type === 'coy' ? (
        coy ? (
          <>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
              {coy.city} {coy.name}
            </div>
            <div style={{ color: '#666', fontSize: 12 }}>{coy.wins}–{18 - coy.wins} record</div>
          </>
        ) : <div style={{ color: '#444', fontSize: 12 }}>Season in progress</div>
      ) : winner ? (
        <>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{winner.name}</div>
          <div style={{ color: '#666', fontSize: 11, marginBottom: 8 }}>
            {winner.team_city} {winner.team_name} · {winner.position_label || winner.position} · {winner.games}G
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginBottom: 8 }}>
            {type === 'off' && winner.position === 'QB' && <>
              <StatLine label="pass yds" value={winner.pass_yards?.toLocaleString()} />
              <StatLine label="pass TDs" value={winner.pass_tds} />
              <StatLine label="INTs" value={winner.interceptions} />
            </>}
            {type === 'off' && winner.position === 'RB' && <>
              <StatLine label="rush yds" value={winner.rush_yards?.toLocaleString()} />
              <StatLine label="rush TDs" value={winner.rush_tds} />
            </>}
            {type === 'off' && (winner.position === 'WR' || winner.position === 'TE') && <>
              <StatLine label="rec yds" value={winner.rec_yards?.toLocaleString()} />
              <StatLine label="rec TDs" value={winner.rec_tds} />
              <StatLine label="rec" value={winner.receptions} />
            </>}
            {type === 'def' && <>
              <StatLine label="tackles" value={winner.tackles} />
              <StatLine label="sacks" value={winner.sacks} />
              <StatLine label="INTs" value={winner.def_interceptions} />
            </>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: ratingColor(winner.overall_rating), fontWeight: 700, fontSize: 13 }}>
              {winner.overall_rating} OVR
            </span>
            {winner.dev_trait && winner.dev_trait !== 'Normal' && (
              <span style={{ color: '#FF8740', fontSize: 10, fontWeight: 700, background: '#2a1a0a', padding: '1px 5px', borderRadius: 3 }}>
                {winner.dev_trait}
              </span>
            )}
          </div>
        </>
      ) : <div style={{ color: '#444', fontSize: 12 }}>No qualifying players</div>}
    </div>
  );
}

interface Props {
  currentSeason: number;
  awards: SeasonAwards | null;
}

export default function AwardsView({ currentSeason, awards }: Props) {
  return (
    <div>
      <div style={{ color: '#FFD700', fontSize: 12, letterSpacing: 1, fontWeight: 700, marginBottom: 16 }}>
        {currentSeason} SEASON AWARDS
      </div>
      {!awards?.mvp && !awards?.dpoy ? (
        <div style={{ color: '#555', fontSize: 13, padding: '24px 0' }}>
          No awards yet — simulate the full regular season first.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <AwardCard award="MVP" icon="🏆" winner={awards?.mvp} type="off" />
            <AwardCard award="OFFENSIVE PLAYER OF THE YEAR" icon="⚡" winner={awards?.opoy} type="off" />
            <AwardCard award="DEFENSIVE PLAYER OF THE YEAR" icon="🛡" winner={awards?.dpoy} type="def" />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <AwardCard award="OFFENSIVE ROOKIE OF THE YEAR" icon="🌟" winner={awards?.oroty} type="off" />
            <AwardCard award="DEFENSIVE ROOKIE OF THE YEAR" icon="🌟" winner={awards?.droty} type="def" />
            <AwardCard award="COACH OF THE YEAR" icon="📋" coy={awards?.coy} type="coy" />
          </div>
        </div>
      )}
    </div>
  );
}
