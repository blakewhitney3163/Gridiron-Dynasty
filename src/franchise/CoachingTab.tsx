import React, { useState } from 'react';
import { ratingColor } from './utils';

declare const window: any;

export interface Coach {
  id: number;
  team_id: number | null;
  role: 'HC' | 'OC' | 'DC' | 'ST';
  first_name: string;
  last_name: string;
  overall_rating: number;
  offense_rating: number;
  defense_rating: number;
  development_rating: number;
  experience: number;
  salary: number;
  years_remaining: number;
}

const ROLE_META: Record<string, {
  label: string; color: string; primaryLabel: string; primaryKey: keyof Coach;
}> = {
  HC: { label: 'Head Coach',           color: '#FFD700', primaryLabel: 'Leadership', primaryKey: 'overall_rating'    },
  OC: { label: 'Off. Coordinator',     color: '#4FC3F7', primaryLabel: 'Offense',    primaryKey: 'offense_rating'    },
  DC: { label: 'Def. Coordinator',     color: '#ef5350', primaryLabel: 'Defense',    primaryKey: 'defense_rating'    },
  ST: { label: 'Special Teams Coord',  color: '#AB47BC', primaryLabel: 'ST Rating',  primaryKey: 'overall_rating'    },
};

const ROLES: Array<'HC' | 'OC' | 'DC' | 'ST'> = ['HC', 'OC', 'DC', 'ST'];

interface Props {
  teamId: number;
  staff: Coach[];
  onRefresh: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

function StatBox({ label, value, text }: { label: string; value?: number; text?: string }) {
  return (
    <div style={{ background: '#0a0a0a', borderRadius: 4, padding: '5px 8px', textAlign: 'center' }}>
      <div style={{ fontSize: 9, color: '#444', letterSpacing: 1, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 'bold', color: value !== undefined ? ratingColor(value) : '#888' }}>
        {text ?? value}
      </div>
    </div>
  );
}

export default function CoachingTab({ teamId, staff, onRefresh, showToast }: Props) {
  const [availableCoaches, setAvailableCoaches] = useState<Coach[]>([]);
  const [showHirePanel, setShowHirePanel] = useState(false);
  const [hireRoleFilter, setHireRoleFilter] = useState<'ALL' | 'HC' | 'OC' | 'DC' | 'ST'>('ALL');
  const [working, setWorking] = useState(false);

  const staffByRole: Partial<Record<string, Coach>> = {};
  for (const coach of staff) staffByRole[coach.role] = coach;

  const loadAvailable = async () => {
    const coaches = await window.api.getAvailableCoaches();
    setAvailableCoaches(coaches);
    setShowHirePanel(true);
  };

  const handleFire = async (coach: Coach) => {
    if (working) return;
    setWorking(true);
    const result = await window.api.fireCoach(coach.id);
    if (!result.success) {
      showToast(result.reason ?? 'Could not release coach.', 'error');
    } else {
      showToast(`${coach.first_name} ${coach.last_name} released.`, 'success');
      onRefresh();
      if (showHirePanel) loadAvailable();
    }
    setWorking(false);
  };

  const handleHire = async (coach: Coach) => {
    if (working) return;
    setWorking(true);
    const result = await window.api.hireCoach({ teamId, coachId: coach.id });
    if (!result.success) {
      showToast(result.reason ?? 'Could not hire coach.', 'error');
    } else {
      showToast(`${coach.first_name} ${coach.last_name} hired as ${ROLE_META[coach.role].label}!`, 'success');
      onRefresh();
      loadAvailable();
    }
    setWorking(false);
  };

  const filteredAvailable = hireRoleFilter === 'ALL'
    ? availableCoaches
    : availableCoaches.filter(c => c.role === hireRoleFilter);

  return (
    <div style={{ padding: '0 0 32px' }}>

      {/* ── Current Staff ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 10, letterSpacing: 2, color: '#555' }}>COACHING STAFF</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 28 }}>
        {ROLES.map(role => {
          const coach = staffByRole[role];
          const meta = ROLE_META[role];

          if (!coach) {
            return (
              <div key={role} style={{
                background: '#0d0d0d', border: '1px dashed #2a2a2a',
                borderRadius: 6, padding: '16px 18px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <RoleBadge role={role} color={meta.color} />
                  <span style={{ fontSize: 11, color: '#444' }}>{meta.label}</span>
                </div>
                <div style={{ fontSize: 11, color: '#333', marginBottom: 12 }}>— No coach hired</div>
                <button onClick={() => { setHireRoleFilter(role); loadAvailable(); }} style={{
                  padding: '4px 12px', fontSize: 10, cursor: 'pointer', borderRadius: 3,
                  background: '#141414', border: `1px solid ${meta.color}44`, color: meta.color,
                }}>Hire {role}</button>
              </div>
            );
          }

          const primaryRating = coach[meta.primaryKey] as number;
          return (
            <div key={role} style={{
              background: '#0d0d0d', border: '1px solid #1a1a1a',
              borderRadius: 6, padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <RoleBadge role={role} color={meta.color} />
                  <span style={{ fontSize: 13, color: '#ddd', fontWeight: 500 }}>
                    {coach.first_name} {coach.last_name}
                  </span>
                </div>
                <span style={{ fontSize: 24, fontWeight: 'bold', color: ratingColor(primaryRating) }}>
                  {primaryRating}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
                <StatBox label={meta.primaryLabel} value={primaryRating} />
                <StatBox label="Dev" value={coach.development_rating} />
                <StatBox label="Exp" text={`${coach.experience}yr`} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 10, color: '#444' }}>
                  ${coach.salary.toFixed(1)}M · {coach.years_remaining}yr left
                </div>
                <button onClick={() => handleFire(coach)} disabled={working} style={{
                  padding: '3px 10px', fontSize: 10, cursor: 'pointer', borderRadius: 3,
                  background: '#1a0000', border: '1px solid #2a0000', color: '#e57373',
                }}>Fire</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Hire Panel Toggle ──────────────────────────────────────────── */}
      {!showHirePanel && (
        <button onClick={loadAvailable} style={{
          padding: '6px 18px', fontSize: 11, cursor: 'pointer', borderRadius: 4,
          background: '#141414', border: '1px solid #2a2a2a', color: '#555', letterSpacing: 1,
        }}>VIEW AVAILABLE COACHES</button>
      )}

      {/* ── Available Coaches ──────────────────────────────────────────── */}
      {showHirePanel && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 10, letterSpacing: 2, color: '#555' }}>AVAILABLE COACHES</span>
            <button onClick={() => setShowHirePanel(false)} style={{
              padding: '2px 8px', fontSize: 10, cursor: 'pointer', borderRadius: 3,
              background: 'transparent', border: '1px solid #222', color: '#444',
            }}>Close</button>
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {(['ALL', 'HC', 'OC', 'DC', 'ST'] as const).map(r => {
              const active = hireRoleFilter === r;
              const color = r === 'ALL' ? '#FF8740' : ROLE_META[r]?.color ?? '#FF8740';
              return (
                <button key={r} onClick={() => setHireRoleFilter(r)} style={{
                  padding: '3px 10px', fontSize: 10, cursor: 'pointer', borderRadius: 3,
                  background: active ? color : '#141414',
                  border: `1px solid ${active ? color : '#2a2a2a'}`,
                  color: active ? '#000' : '#555', fontWeight: active ? 'bold' : 'normal',
                }}>{r}</button>
              );
            })}
          </div>

          {filteredAvailable.length === 0 ? (
            <div style={{ fontSize: 11, color: '#333', padding: '16px 0' }}>
              No coaches available in this role.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredAvailable.map(coach => {
                const meta = ROLE_META[coach.role];
                const primaryRating = coach[meta.primaryKey] as number;
                return (
                  <div key={coach.id} style={{
                    background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 5,
                    padding: '10px 14px', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <RoleBadge role={coach.role} color={meta.color} />
                      <div>
                        <div style={{ fontSize: 12, color: '#ccc' }}>
                          {coach.first_name} {coach.last_name}
                        </div>
                        <div style={{ fontSize: 10, color: '#444' }}>{meta.label}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 9, color: '#444', letterSpacing: 1 }}>{meta.primaryLabel}</div>
                        <div style={{ fontSize: 18, fontWeight: 'bold', color: ratingColor(primaryRating) }}>
                          {primaryRating}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 9, color: '#444', letterSpacing: 1 }}>EXP</div>
                        <div style={{ fontSize: 13, color: '#777' }}>{coach.experience}yr</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 9, color: '#444', letterSpacing: 1 }}>ASK</div>
                        <div style={{ fontSize: 13, color: '#888' }}>${coach.salary.toFixed(1)}M</div>
                      </div>
                      <button onClick={() => handleHire(coach)} disabled={working} style={{
                        padding: '5px 14px', fontSize: 11, fontWeight: 'bold', cursor: 'pointer',
                        borderRadius: 4, background: working ? '#141414' : '#1a3a1a',
                        border: '1px solid #4caf5055', color: working ? '#444' : '#4caf50',
                      }}>Hire</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RoleBadge({ role, color }: { role: string; color: string }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 'bold', letterSpacing: 1.5,
      padding: '2px 7px', borderRadius: 3,
      background: `${color}22`, border: `1px solid ${color}55`, color,
    }}>{role}</span>
  );
}
