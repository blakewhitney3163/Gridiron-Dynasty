import React from 'react';
import { FreeAgent, CapSummary, RosterSpots } from './types';
import { POSITIONS, TRAIT_META, ratingColor, trajectory, fmtSalary, fairMarketValue } from './utils';

interface Props {
  freeAgents: FreeAgent[];
  cap: CapSummary | null;
  rosterSpots: RosterSpots | null;
  teamNeeds: string[];
  faPos: string;
  setFaPos: (p: string) => void;
  faSortBy: 'ovr' | 'age' | 'value';
  setFaSortBy: (s: 'ovr' | 'age' | 'value') => void;
  faSearch: string;
  setFaSearch: (v: string) => void;
  signingId: number | null;
  setSigningId: (id: number | null) => void;
  signYears: number;
  setSignYears: (y: number) => void;
  signSalary: string;
  setSignSalary: (s: string) => void;
  psSigningId: number | null;
  handleSign: () => void;
  handleSignToPs: (fa: FreeAgent) => void;
  working: boolean;
}

export default function FreeAgentsTab({
  freeAgents, cap, rosterSpots, teamNeeds,
  faPos, setFaPos, faSortBy, setFaSortBy, faSearch, setFaSearch,
  signingId, setSigningId, signYears, setSignYears, signSalary, setSignSalary,
  psSigningId, handleSign, handleSignToPs, working,
}: Props) {
  const filteredFa = freeAgents
    .filter(f => faPos === 'ALL' ? true : faPos === 'NEEDS' ? teamNeeds.includes(f.position) : f.position === faPos)
    .filter(f => {
      if (!faSearch.trim()) return true;
      const q = faSearch.toLowerCase();
      return `${f.first_name} ${f.last_name}`.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (faSortBy === 'age') return a.age - b.age;
      if (faSortBy === 'value') return fairMarketValue(b.position, b.overall_rating, b.dev_trait) - fairMarketValue(a.position, a.overall_rating, a.dev_trait);
      return b.overall_rating - a.overall_rating;
    });

  const signingPlayer = signingId ? freeAgents.find(f => f.id === signingId) : null;
  const signSalaryNum = parseFloat(signSalary) || 0;
  const signCapLeft = cap ? cap.available_cap - signSalaryNum : 0;

  const openSign = (fa: FreeAgent) => {
    setSigningId(fa.id);
    const mv = fairMarketValue(fa.position, fa.overall_rating, fa.dev_trait);
    setSignYears(fa.age <= 26 ? 3 : fa.age <= 30 ? 2 : 1);
    setSignSalary(mv.toFixed(1));
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {['NEEDS', ...POSITIONS].map(pos => {
            const isNeeds = pos === 'NEEDS';
            const isActive = faPos === pos;
            return (
              <button key={pos} onClick={() => { setFaPos(pos); setSigningId(null); }} style={{
                padding: '3px 9px',
                background: isActive ? (isNeeds ? '#4a3020' : '#4FC3F7') : isNeeds ? '#1a0e00' : '#141414',
                border: `1px solid ${isActive ? (isNeeds ? '#FF8740' : '#4FC3F7') : isNeeds ? '#FF8740' : '#222'}`,
                borderRadius: 3,
                color: isActive ? (isNeeds ? '#FF8740' : '#000') : isNeeds ? '#FF8740' : '#555',
                fontSize: 11, cursor: 'pointer',
                fontWeight: isActive || isNeeds ? 'bold' : 'normal',
              }}>{isNeeds ? `NEEDS${teamNeeds.length > 0 ? ` (${teamNeeds.length})` : ''}` : pos}</button>
            );
          })}
        </div>
        <select onChange={e => setFaSortBy(e.target.value as any)} value={faSortBy} style={{
          marginLeft: 'auto', background: '#161616', border: '1px solid #2a2a2a',
          borderRadius: 5, color: '#ccc', padding: '4px 10px', fontSize: 12,
        }}>
          <option value="ovr">Sort: OVR</option>
          <option value="value">Sort: Market Value</option>
          <option value="age">Sort: Age</option>
        </select>
        <input
          placeholder="Search player..."
          value={faSearch}
          onChange={e => setFaSearch(e.target.value)}
          style={{
            background: '#161616', border: '1px solid #2a2a2a', borderRadius: 5,
            color: '#ccc', padding: '4px 10px', fontSize: 12, width: 160,
          }}
        />
      </div>

      {rosterSpots && cap && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 12, flexWrap: 'wrap' }}>
          <span style={{ color: rosterSpots.activeFree > 0 ? '#4caf50' : '#e57373' }}>
            Active: {rosterSpots.active}/53 · {rosterSpots.activeFree > 0 ? `${rosterSpots.activeFree} open` : 'FULL'}
          </span>
          <span style={{ color: rosterSpots.psFree > 0 ? '#4FC3F7' : '#555' }}>
            PS: {rosterSpots.ps}/16 · {rosterSpots.psFree > 0 ? `${rosterSpots.psFree} open` : 'FULL'}
          </span>
          <span style={{ color: cap.available_cap > 0 ? '#4caf50' : '#e57373' }}>
            Cap: {fmtSalary(cap.available_cap)} {cap.available_cap < 0 ? '(OVER)' : 'available'}
          </span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 100px auto', gap: 8, padding: '6px 12px', fontSize: 10, color: '#333', letterSpacing: 1, borderBottom: '1px solid #1a1a1a', marginBottom: 4 }}>
        <span>PLAYER</span><span>AGE / OVR</span><span>DEV</span><span>MARKET VALUE</span>
      </div>

      {filteredFa.length === 0 ? (
        <div style={{ color: '#333', padding: '20px 12px', fontSize: 13 }}>No free agents found</div>
      ) : filteredFa.map(fa => {
        const trait = TRAIT_META[fa.dev_trait] ?? TRAIT_META['Normal'];
        const traj = trajectory(fa.age);
        const mv = fairMarketValue(fa.position, fa.overall_rating, fa.dev_trait);
        const isSigning = signingId === fa.id;

        return (
          <div key={fa.id} style={{ borderBottom: '1px solid #0d0d0d' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#ddd', fontWeight: 600, fontSize: 13 }}>{fa.first_name} {fa.last_name}</span>
                  {trait.short && <span style={{ background: trait.color, color: '#000', fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 3 }}>{trait.short}</span>}
                </div>
                <span style={{ color: '#444', fontSize: 11 }}>{fa.position_label || fa.position}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 60 }}>
                <span style={{ color: traj.color, fontSize: 12 }}>{fa.age} {traj.label}</span>
                <span style={{ color: ratingColor(fa.overall_rating), fontWeight: 700, fontSize: 14 }}>{fa.overall_rating}</span>
              </div>
              <div style={{ width: 70, color: trait.color, fontSize: 11, textAlign: 'center', fontWeight: fa.dev_trait !== 'Normal' ? 700 : 'normal' }}>
                {fa.dev_trait === 'Normal' ? '—' : fa.dev_trait}
              </div>
              <div style={{ width: 100, color: '#888', fontSize: 12 }}>{fmtSalary(mv)}/yr</div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => isSigning ? setSigningId(null) : openSign(fa)}
                  disabled={!!(rosterSpots && rosterSpots.activeFree <= 0)}
                  style={{
                    padding: '4px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 4,
                    background: isSigning ? '#0a1a3a' : '#141414',
                    border: `1px solid ${isSigning ? '#4FC3F7' : rosterSpots && rosterSpots.activeFree <= 0 ? '#1a1a1a' : '#2a2a2a'}`,
                    color: isSigning ? '#4FC3F7' : rosterSpots && rosterSpots.activeFree <= 0 ? '#2a2a2a' : '#555',
                  }}>
                  {isSigning ? 'Cancel' : 'Sign'}
                </button>
                <button
                  onClick={() => handleSignToPs(fa)}
                  disabled={!!(psSigningId === fa.id || (rosterSpots && rosterSpots.psFree <= 0))}
                  title="Sign to Practice Squad (1yr, min salary)"
                  style={{
                    padding: '4px 8px', fontSize: 10, cursor: 'pointer', borderRadius: 4,
                    background: '#141414',
                    border: `1px solid ${rosterSpots && rosterSpots.psFree <= 0 ? '#1a1a1a' : '#1a2a3a'}`,
                    color: psSigningId === fa.id ? '#888' : rosterSpots && rosterSpots.psFree <= 0 ? '#2a2a2a' : '#4FC3F7',
                    fontWeight: 700, letterSpacing: 0.5,
                  }}>
                  {psSigningId === fa.id ? '...' : 'PS'}
                </button>
              </div>
            </div>

            {isSigning && signingPlayer && (
              <div style={{ background: '#080e18', border: '1px solid #1a2a3a', borderRadius: 6, margin: '0 12px 10px', padding: '12px 16px' }}>
                <div style={{ color: '#4FC3F7', fontSize: 11, fontWeight: 700, marginBottom: 10 }}>OFFER CONTRACT — {fa.first_name} {fa.last_name}</div>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ color: '#333', fontSize: 10, marginBottom: 6 }}>YEARS</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1,2,3,4,5].map(y => (
                        <button key={y} onClick={() => setSignYears(y)} style={{ width: 32, height: 32, background: signYears === y ? '#4FC3F7' : '#141414', border: `1px solid ${signYears === y ? '#4FC3F7' : '#2a2a2a'}`, borderRadius: 4, color: signYears === y ? '#000' : '#555', fontWeight: 'bold', fontSize: 12, cursor: 'pointer' }}>{y}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#333', fontSize: 10, marginBottom: 6 }}>ANNUAL SALARY (M)</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#555', fontSize: 13 }}>$</span>
                      <input type="number" value={signSalary} onChange={e => setSignSalary(e.target.value)} min="0.9" step="0.5"
                        style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 4, color: '#ccc', padding: '6px 10px', fontSize: 13, width: 80 }} />
                      <span style={{ color: '#555', fontSize: 13 }}>M</span>
                    </div>
                    <div style={{ color: '#333', fontSize: 10, marginTop: 4 }}>Market: {fmtSalary(mv)}/yr</div>
                  </div>
                  <div>
                    <div style={{ color: '#333', fontSize: 10, marginBottom: 6 }}>CAP AFTER SIGNING</div>
                    <div style={{ color: signCapLeft < 0 ? '#e57373' : '#4caf50', fontSize: 13 }}>{fmtSalary(signCapLeft)} remaining</div>
                    <div style={{ color: '#555', fontSize: 11 }}>{rosterSpots && `${rosterSpots.activeFree - 1} roster spot${rosterSpots.activeFree - 1 !== 1 ? 's' : ''} left after`}</div>
                  </div>
                </div>
                <button onClick={handleSign} disabled={working || signCapLeft < 0} style={{ marginTop: 10, padding: '6px 16px', background: signCapLeft < 0 ? '#1a1a1a' : '#0a1a3a', border: `1px solid ${signCapLeft < 0 ? '#2a2a2a' : '#4FC3F7'}`, borderRadius: 4, color: signCapLeft < 0 ? '#333' : '#4FC3F7', fontSize: 12, cursor: signCapLeft < 0 ? 'not-allowed' : 'pointer' }}>
                  {working ? '...' : signCapLeft < 0 ? 'OVER CAP' : 'Confirm Signing'}
                </button>
              </div>
            )}
          </div>
        );
      })}

      <div style={{ color: '#333', fontSize: 11, padding: '10px 12px' }}>
        {filteredFa.length} free agent{filteredFa.length !== 1 ? 's' : ''} shown (top 200 by OVR)
      </div>
    </div>
  );
}
