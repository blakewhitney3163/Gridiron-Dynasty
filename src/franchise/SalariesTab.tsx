import React, { useState } from 'react';
import { Contract, CapSummary } from './types';
import { POSITIONS, TRAIT_META, ratingColor, fmtSalary, fairMarketValue } from './utils';

interface Props {
  contracts: Contract[];
  cap: CapSummary | null;
}

type SortKey = 'salary' | 'years' | 'ovr' | 'age' | 'gtd';

export default function SalariesTab({ contracts, cap }: Props) {
  const [posFilter, setPosFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<SortKey>('salary');
  const [search, setSearch] = useState('');

  const filtered = contracts
    .filter(c => posFilter === 'ALL' || c.position === posFilter || c.position_label === posFilter)
    .filter(c => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return `${c.first_name} ${c.last_name}`.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'salary') return b.annual_salary - a.annual_salary;
      if (sortBy === 'years') return b.years_remaining - a.years_remaining;
      if (sortBy === 'ovr') return b.overall_rating - a.overall_rating;
      if (sortBy === 'age') return a.age - b.age;
      if (sortBy === 'gtd') return (b.guaranteed_amount ?? 0) - (a.guaranteed_amount ?? 0);
      return 0;
    });

  const totalShown = filtered.reduce((s, c) => s + c.annual_salary, 0);
  const totalGuaranteed = filtered.reduce((s, c) => s + (c.guaranteed_amount ?? 0), 0);
  const capPct = cap ? (cap.used_cap / cap.total_cap) * 100 : 0;
  const capBarColor = capPct > 100 ? '#e57373' : capPct > 90 ? '#FF8740' : '#4caf50';

  return (
    <>
      {cap && (
        <div style={{ marginBottom: 14, padding: '10px 14px', background: '#0d1b0d', border: '1px solid #1a2a1a', borderRadius: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: '#555', letterSpacing: 1 }}>SALARY CAP</span>
            <span style={{ fontSize: 11, color: capBarColor, fontWeight: 700 }}>
              {fmtSalary(cap.used_cap)} / {fmtSalary(cap.total_cap)}
              <span style={{ color: '#555', fontWeight: 400, marginLeft: 8 }}>
                ({cap.available_cap >= 0 ? fmtSalary(cap.available_cap) + ' available' : 'OVER by ' + fmtSalary(Math.abs(cap.available_cap))})
              </span>
            </span>
          </div>
          <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(capPct, 100)}%`, height: '100%', background: capBarColor, borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        {POSITIONS.map(pos => (
          <button key={pos} onClick={() => setPosFilter(pos)} style={{
            padding: '3px 9px', background: posFilter === pos ? '#FF8740' : '#141414',
            border: `1px solid ${posFilter === pos ? '#FF8740' : '#222'}`, borderRadius: 3,
            color: posFilter === pos ? '#000' : '#555', fontSize: 11, cursor: 'pointer',
            fontWeight: posFilter === pos ? 'bold' : 'normal',
          }}>{pos}</button>
        ))}
        <select onChange={e => setSortBy(e.target.value as SortKey)} value={sortBy} style={{
          background: '#161616', border: '1px solid #2a2a2a', borderRadius: 5,
          color: '#ccc', padding: '4px 10px', fontSize: 12, marginLeft: 'auto',
        }}>
          <option value="salary">Sort: Salary</option>
          <option value="gtd">Sort: Guaranteed</option>
          <option value="years">Sort: Years Left</option>
          <option value="ovr">Sort: OVR</option>
          <option value="age">Sort: Age</option>
        </select>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search player..."
          style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 5, color: '#ccc', padding: '4px 10px', fontSize: 12, width: 160 }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 60px 50px 40px 90px 90px 80px 70px', padding: '4px 10px', fontSize: 10, color: '#444', letterSpacing: 1, borderBottom: '1px solid #1a1a1a' }}>
        <span>PLAYER</span><span style={{ textAlign: 'center' }}>POS</span><span style={{ textAlign: 'center' }}>OVR</span>
        <span style={{ textAlign: 'center' }}>AGE</span><span style={{ textAlign: 'right' }}>SALARY/YR</span>
        <span style={{ textAlign: 'right' }}>GUARANTEED</span><span style={{ textAlign: 'center' }}>YEARS</span>
        <span style={{ textAlign: 'right' }}>VALUE</span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ color: '#333', fontSize: 12, padding: '20px 10px', textAlign: 'center' }}>No contracts found</div>
      ) : filtered.map(c => {
        const trait = TRAIT_META[c.dev_trait] ?? TRAIT_META['Normal'];
        const fmv = fairMarketValue(c.position, c.overall_rating, c.dev_trait);
        const ratio = c.annual_salary / Math.max(fmv, 1);
        const valueColor = ratio < 0.70 ? '#4caf50' : ratio > 2.00 ? '#e57373' : '#888';
        const valueLabel = ratio < 0.70 ? 'DEAL' : ratio > 2.00 ? 'OVER' : 'FAIR';
        const isExpiring = c.years_remaining === 1;
        const gtdPct = c.guaranteed_pct ?? 0;

        return (
          <div key={c.id} style={{
            display: 'grid', gridTemplateColumns: '2fr 60px 50px 40px 90px 90px 80px 70px',
            padding: '6px 10px', borderBottom: '1px solid #111',
            background: isExpiring ? '#140a00' : 'transparent', alignItems: 'center',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: '#ddd', fontSize: 12, fontWeight: 600 }}>{c.first_name} {c.last_name}</span>
                {trait.short && <span style={{ background: trait.bg, color: trait.color, fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3 }}>{trait.short}</span>}
                {isExpiring && <span style={{ color: '#FF8740', fontSize: 9, fontWeight: 700 }}>⚠ EXP</span>}
              </div>
            </div>
            <div style={{ textAlign: 'center', color: '#666', fontSize: 11 }}>{c.position_label || c.position}</div>
            <div style={{ textAlign: 'center', color: ratingColor(c.overall_rating), fontSize: 13, fontWeight: 700 }}>{c.overall_rating}</div>
            <div style={{ textAlign: 'center', color: '#777', fontSize: 11 }}>{c.age}</div>
            <div style={{ textAlign: 'right', color: '#ccc', fontSize: 12, fontWeight: 600 }}>{fmtSalary(c.annual_salary)}</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: gtdPct >= 60 ? '#4caf50' : gtdPct >= 35 ? '#FF8740' : '#555', fontSize: 12 }}>{fmtSalary(c.guaranteed_amount ?? 0)}</div>
              {gtdPct > 0 && <div style={{ color: '#444', fontSize: 10 }}>{gtdPct.toFixed(0)}% GTD</div>}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 2 }}>
                {Array.from({ length: Math.min(c.years_total, 7) }).map((_, i) => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: 1, background: i < c.years_remaining ? '#4caf50' : '#1a1a1a', border: '1px solid #2a2a2a' }} />
                ))}
              </div>
              <div style={{ color: isExpiring ? '#FF8740' : '#555', fontSize: 10 }}>{c.years_remaining}/{c.years_total}yr</div>
            </div>
            <div style={{ textAlign: 'right', color: valueColor, fontSize: 11, fontWeight: 700 }}>{valueLabel}</div>
          </div>
        );
      })}

      {filtered.length > 0 && (
        <div style={{ padding: '8px 10px', borderTop: '1px solid #1a1a1a', display: 'flex', gap: 24, fontSize: 11, color: '#444', marginTop: 4 }}>
          <span>{filtered.length} player{filtered.length !== 1 ? 's' : ''}</span>
          <span>Total: <span style={{ color: '#ccc' }}>{fmtSalary(totalShown)}</span></span>
          <span>Guaranteed: <span style={{ color: '#FF8740' }}>{fmtSalary(totalGuaranteed)}</span></span>
        </div>
      )}
    </>
  );
}
