import React, { useEffect, useState } from 'react';

declare const window: any;

interface Contract {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  position_label: string;
  overall_rating: number;
  age: number;
  dev_trait: string;
  annual_salary: number;
  years_remaining: number;
  years_total: number;
  contract_id: number;
}

interface CapSummary {
  total_cap: number;
  used_cap: number;
  available_cap: number;
}

interface Props {
  userTeam: { id: number; city: string; name: string };
  currentSeason: number;
}

const POSITIONS = ['ALL', 'QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K'];

const TRAIT_META: Record<string, { color: string; short: string }> = {
  'Normal':    { color: '#444',    short: ''   },
  'Star':      { color: '#4FC3F7', short: 'S'  },
  'Superstar': { color: '#FF8740', short: 'SS' },
  'X-Factor':  { color: '#FFD700', short: 'XF' },
};

function ratingColor(r: number): string {
  if (r >= 90) return '#FFD700';
  if (r >= 80) return '#4caf50';
  if (r >= 70) return '#FF8740';
  return '#888';
}

function trajectory(age: number): { label: string; color: string } {
  if (age <= 26) return { label: '↑', color: '#4caf50' };
  if (age <= 30) return { label: '→', color: '#FF8740' };
  return              { label: '↓', color: '#777'    };
}

function fmtSalary(m: number): string {
  return `$${m.toFixed(1)}M`;
}

export default function Franchise({ userTeam, currentSeason }: Props) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [cap, setCap]             = useState<CapSummary | null>(null);
  const [posFilter, setPosFilter] = useState('ALL');
  const [sortBy, setSortBy]       = useState<'salary' | 'years' | 'ovr' | 'age'>('salary');
  const [extendingId, setExtendingId] = useState<number | null>(null);
  const [extendYears, setExtendYears] = useState(3);
  const [extendSalary, setExtendSalary] = useState('');
  const [releasingId, setReleasingId]   = useState<number | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => { loadData(); }, [userTeam.id]);

  const loadData = async () => {
    const [c, s] = await Promise.all([
      window.api.getTeamContracts(userTeam.id),
      window.api.getCapSummary(userTeam.id),
    ]);
    setContracts(c);
    setCap(s);
  };

  const openExtend = (contract: Contract) => {
    setExtendingId(contract.id);
    setReleasingId(null);
    setExtendYears(Math.min(contract.years_remaining + 2, 5));
    setExtendSalary(contract.annual_salary.toFixed(1));
  };

  const handleExtend = async () => {
    if (!extendingId || working) return;
    const salary = parseFloat(extendSalary);
    if (isNaN(salary) || salary <= 0) return;

    const current = contracts.find(c => c.id === extendingId);
    const capImpact = salary - (current?.annual_salary ?? 0);
    if (cap && capImpact > cap.available_cap + 0.1) {
      alert(`Not enough cap space. Need $${capImpact.toFixed(1)}M more.`);
      return;
    }

    setWorking(true);
    await window.api.extendPlayer({ playerId: extendingId, years: extendYears, salary });
    setExtendingId(null);
    await loadData();
    setWorking(false);
  };

  const handleRelease = async () => {
    if (!releasingId || working) return;
    setWorking(true);
    await window.api.releasePlayer(releasingId);
    setReleasingId(null);
    await loadData();
    setWorking(false);
  };

  const filtered = contracts
    .filter(c => posFilter === 'ALL' || c.position === posFilter)
    .sort((a, b) => {
      if (sortBy === 'salary') return b.annual_salary - a.annual_salary;
      if (sortBy === 'years')  return a.years_remaining - b.years_remaining;
      if (sortBy === 'ovr')    return b.overall_rating - a.overall_rating;
      if (sortBy === 'age')    return a.age - b.age;
      return 0;
    });

  const expiring = contracts.filter(c => c.years_remaining === 1).length;
  const capPct   = cap ? (cap.used_cap / cap.total_cap) * 100 : 0;
  const capColor = capPct > 90 ? '#e57373' : capPct > 75 ? '#FF8740' : '#4caf50';

  const currentExtend = extendingId ? contracts.find(c => c.id === extendingId) : null;
  const extendSalaryNum = parseFloat(extendSalary) || 0;
  const capDelta = currentExtend ? extendSalaryNum - currentExtend.annual_salary : 0;
  const newAvailable = cap ? cap.available_cap - capDelta : 0;

  return (
    <div style={{ padding: 20, color: '#fff', fontFamily: 'sans-serif', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #1e1e1e' }}>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: '#FF8740', marginBottom: 4 }}>
          Franchise Management
        </div>
        <div style={{ fontSize: 13, color: '#555' }}>
          {userTeam.city} {userTeam.name} · {currentSeason} Season
        </div>
      </div>

      {/* Cap Bar */}
      {cap && (
        <div style={{ background: '#0e0e0e', border: '1px solid #1e1e1e', borderRadius: 8, padding: '14px 16px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#ccc' }}>Salary Cap</div>
            <div style={{ display: 'flex', gap: 20, fontSize: 12 }}>
              <span style={{ color: capColor }}>{fmtSalary(cap.used_cap)} used</span>
              <span style={{ color: '#555' }}>/ {fmtSalary(cap.total_cap)} cap</span>
              <span style={{ color: '#4caf50', fontWeight: 'bold' }}>{fmtSalary(cap.available_cap)} available</span>
            </div>
          </div>
          <div style={{ height: 8, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(capPct, 100)}%`, background: capColor, borderRadius: 4, transition: 'width 0.4s' }} />
          </div>
          {expiring > 0 && (
            <div style={{ marginTop: 8, fontSize: 11, color: '#FF8740' }}>
              ⚠ {expiring} player{expiring > 1 ? 's' : ''} expiring this offseason
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {POSITIONS.map(pos => (
            <button
              key={pos}
              onClick={() => setPosFilter(pos)}
              style={{
                padding: '3px 9px',
                background: posFilter === pos ? '#FF8740' : '#141414',
                border: `1px solid ${posFilter === pos ? '#FF8740' : '#222'}`,
                borderRadius: 3, color: posFilter === pos ? '#000' : '#555',
                fontSize: 11, cursor: 'pointer', fontWeight: posFilter === pos ? 'bold' : 'normal',
              }}
            >
              {pos}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 5, color: '#ccc', padding: '4px 10px', fontSize: 12 }}
        >
          <option value="salary">Sort: Salary</option>
          <option value="years">Sort: Expiring First</option>
          <option value="ovr">Sort: OVR</option>
          <option value="age">Sort: Age</option>
        </select>
      </div>

      {/* Contract Table */}
      <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 8, overflow: 'hidden' }}>

        {/* Table Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 80px 60px 120px 100px 160px',
          padding: '8px 14px', borderBottom: '1px solid #1a1a1a',
          fontSize: 10, color: '#444', letterSpacing: 0.8,
        }}>
          <span>PLAYER</span>
          <span>AGE / OVR</span>
          <span>DEV</span>
          <span>SALARY</span>
          <span>YEARS</span>
          <span></span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#333', fontSize: 13 }}>
            No contracts found
          </div>
        ) : (
          filtered.map(contract => {
            const isExpiring = contract.years_remaining === 1;
            const trait      = TRAIT_META[contract.dev_trait] ?? TRAIT_META['Normal'];
            const traj       = trajectory(contract.age);
            const isExtending = extendingId === contract.id;
            const isReleasing = releasingId === contract.id;

            return (
              <div key={contract.id}>
                {/* Main Row */}
                <div
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 80px 60px 120px 100px 160px',
                    padding: '10px 14px', borderBottom: '1px solid #141414',
                    background: isExpiring ? '#1a1200' : 'transparent',
                    alignItems: 'center',
                  }}
                >
                  {/* Player */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, color: '#ccc', fontWeight: '500' }}>
                        {contract.first_name} {contract.last_name}
                      </span>
                      {trait.short && (
                        <span style={{ fontSize: 8, fontWeight: 'bold', color: '#000', background: trait.color, padding: '1px 4px', borderRadius: 2 }}>
                          {trait.short}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: '#555' }}>
                      {contract.position_label || contract.position}
                    </div>
                  </div>

                  {/* Age / OVR */}
                  <div>
                    <span style={{ fontSize: 11, color: '#777' }}>
                      {contract.age} <span style={{ color: traj.color }}>{traj.label}</span>
                    </span>
                    <div style={{ fontSize: 13, fontWeight: 'bold', color: ratingColor(contract.overall_rating) }}>
                      {contract.overall_rating}
                    </div>
                  </div>

                  {/* Dev */}
                  <div style={{ fontSize: 11, color: trait.color || '#444' }}>
                    {contract.dev_trait === 'Normal' ? '—' : contract.dev_trait}
                  </div>

                  {/* Salary */}
                  <div style={{ fontSize: 13, color: '#ccc', fontWeight: '500' }}>
                    {fmtSalary(contract.annual_salary)}
                  </div>

                  {/* Years */}
                  <div>
                    <span style={{ fontSize: 13, color: isExpiring ? '#FF8740' : '#ccc' }}>
                      {contract.years_remaining} yr{contract.years_remaining > 1 ? 's' : ''}
                    </span>
                    {isExpiring && <span style={{ fontSize: 10, color: '#FF8740', marginLeft: 4 }}>⚠</span>}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => isExtending ? setExtendingId(null) : openExtend(contract)}
                      style={{
                        padding: '4px 10px', background: isExtending ? '#1a3a1a' : '#141414',
                        border: `1px solid ${isExtending ? '#4caf50' : '#2a2a2a'}`,
                        borderRadius: 4, color: isExtending ? '#4caf50' : '#777',
                        fontSize: 11, cursor: 'pointer',
                      }}
                    >
                      {isExtending ? 'Cancel' : 'Extend'}
                    </button>
                    <button
                      onClick={() => isReleasing ? setReleasingId(null) : (setReleasingId(contract.id), setExtendingId(null))}
                      style={{
                        padding: '4px 10px', background: isReleasing ? '#3a0a0a' : '#141414',
                        border: `1px solid ${isReleasing ? '#e57373' : '#2a2a2a'}`,
                        borderRadius: 4, color: isReleasing ? '#e57373' : '#777',
                        fontSize: 11, cursor: 'pointer',
                      }}
                    >
                      {isReleasing ? 'Cancel' : 'Cut'}
                    </button>
                  </div>
                </div>

                {/* Extend Panel */}
                {isExtending && currentExtend && (
                  <div style={{ padding: '12px 16px', background: '#0a140a', borderBottom: '1px solid #1a2a1a' }}>
                    <div style={{ fontSize: 11, color: '#4caf50', marginBottom: 10, fontWeight: 'bold' }}>
                      OFFER EXTENSION — {contract.first_name} {contract.last_name}
                    </div>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>

                      {/* Years selector */}
                      <div>
                        <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>YEARS</div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {[1, 2, 3, 4, 5].map(y => (
                            <button
                              key={y}
                              onClick={() => setExtendYears(y)}
                              style={{
                                width: 32, height: 32,
                                background: extendYears === y ? '#4caf50' : '#141414',
                                border: `1px solid ${extendYears === y ? '#4caf50' : '#2a2a2a'}`,
                                borderRadius: 4, color: extendYears === y ? '#000' : '#777',
                                fontWeight: 'bold', fontSize: 12, cursor: 'pointer',
                              }}
                            >
                              {y}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Salary input */}
                      <div>
                        <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>ANNUAL SALARY (M)</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ color: '#555', fontSize: 13 }}>$</span>
                          <input
                            type="number"
                            value={extendSalary}
                            onChange={e => setExtendSalary(e.target.value)}
                            min="0.1"
                            step="0.5"
                            style={{
                              background: '#141414', border: '1px solid #2a2a2a',
                              borderRadius: 4, color: '#ccc', padding: '6px 10px',
                              fontSize: 13, width: 80,
                            }}
                          />
                          <span style={{ color: '#555', fontSize: 13 }}>M</span>
                        </div>
                      </div>

                      {/* Cap impact */}
                      <div style={{ fontSize: 12 }}>
                        <div style={{ color: '#555', marginBottom: 2 }}>Cap Impact</div>
                        <div style={{ color: capDelta > 0 ? '#e57373' : '#4caf50' }}>
                          {capDelta > 0 ? '+' : ''}{fmtSalary(capDelta)} vs current
                        </div>
                        <div style={{ color: newAvailable < 0 ? '#e57373' : '#777', fontSize: 11 }}>
                          {fmtSalary(Math.max(0, newAvailable))} remaining after
                        </div>
                      </div>

                      {/* Confirm */}
                      <button
                        onClick={handleExtend}
                        disabled={working || extendSalaryNum <= 0 || newAvailable < 0}
                        style={{
                          padding: '8px 18px',
                          background: working || extendSalaryNum <= 0 || newAvailable < 0 ? '#1a1a1a' : '#4caf50',
                          border: 'none', borderRadius: 5,
                          color: working || extendSalaryNum <= 0 || newAvailable < 0 ? '#444' : '#000',
                          fontWeight: 'bold', fontSize: 13, cursor: 'pointer',
                        }}
                      >
                        {working ? '...' : 'Confirm Extension'}
                      </button>
                    </div>
                    {newAvailable < 0 && (
                      <div style={{ marginTop: 8, fontSize: 11, color: '#e57373' }}>
                        Over cap by {fmtSalary(Math.abs(newAvailable))} — reduce salary or cut a player first.
                      </div>
                    )}
                  </div>
                )}

                {/* Release Confirmation */}
                {isReleasing && (
                  <div style={{ padding: '12px 16px', background: '#140a0a', borderBottom: '1px solid #2a1a1a' }}>
                    <div style={{ fontSize: 12, color: '#e57373', marginBottom: 10 }}>
                      Release {contract.first_name} {contract.last_name}? This frees <strong>{fmtSalary(contract.annual_salary)}</strong> in cap space immediately.
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={handleRelease}
                        disabled={working}
                        style={{
                          padding: '6px 16px', background: '#e57373', border: 'none',
                          borderRadius: 4, color: '#000', fontWeight: 'bold', fontSize: 12, cursor: 'pointer',
                        }}
                      >
                        {working ? '...' : 'Confirm Release'}
                      </button>
                      <button
                        onClick={() => setReleasingId(null)}
                        style={{
                          padding: '6px 16px', background: '#141414', border: '1px solid #2a2a2a',
                          borderRadius: 4, color: '#777', fontSize: 12, cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Summary footer */}
      {contracts.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 11, color: '#444', textAlign: 'right' }}>
          {filtered.length} player{filtered.length !== 1 ? 's' : ''} · {fmtSalary(filtered.reduce((s, c) => s + c.annual_salary, 0))} shown
        </div>
      )}
    </div>
  );
}