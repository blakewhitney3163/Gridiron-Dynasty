import React, { useState } from 'react';
import { T } from '../theme';
import { Player, PlayerStats, CareerSeasonStats } from './types';
import { getRatingCols, getOvrColor, attrColor, DEF_POSITIONS, showStats, getCareerHeaders } from './teamsUtils';

declare const window: any;

// ─── Tier config ──────────────────────────────────────────────────────────────

function getTier(ovr: number) {
  if (ovr >= 96) return {
    bg: 'linear-gradient(150deg, #1c0e00 0%, #3a2000 60%, #1c0e00 100%)',
    border: '#FFD700', ovrColor: '#FFD700', accent: '#FFD700', label: 'ICON',
  };
  if (ovr >= 90) return {
    bg: 'linear-gradient(150deg, #080818 0%, #1a0835 60%, #080818 100%)',
    border: '#C084FC', ovrColor: '#d4aaff', accent: '#C084FC', label: 'ELITE',
  };
  if (ovr >= 80) return {
    bg: 'linear-gradient(150deg, #0c1000 0%, #1e2c00 60%, #0c1000 100%)',
    border: '#c9a227', ovrColor: '#FFD700', accent: '#c9a227', label: 'GOLD',
  };
  if (ovr >= 70) return {
    bg: 'linear-gradient(150deg, #0d0d14 0%, #1a1a28 60%, #0d0d14 100%)',
    border: '#9ca3af', ovrColor: '#e2e8f0', accent: '#9ca3af', label: 'SILVER',
  };
  return {
    bg: 'linear-gradient(150deg, #130900 0%, #241200 60%, #130900 100%)',
    border: '#cd7f32', ovrColor: '#e8975a', accent: '#cd7f32', label: 'BRONZE',
  };
}

const DEV_META: Record<string, { label: string; color: string; icon: string }> = {
  Star:       { label: 'STAR',       color: '#4FC3F7', icon: '★' },
  Superstar:  { label: 'SUPERSTAR',  color: '#C084FC', icon: '★★' },
  'X-Factor': { label: 'X-FACTOR',  color: '#FFD700', icon: '⚡' },
};

// ─── Madden-style card ────────────────────────────────────────────────────────

function MaddenCard({ player }: { player: Player }) {
  const ovr = player.overall_rating;
  const pos = player.position_label || player.position;
  const attrs = getRatingCols(pos);
  const tier = getTier(ovr);
  const dev = DEV_META[player.dev_trait] ?? null;

  return (
    <div style={{
      background: tier.bg,
      border: `2px solid ${tier.border}55`,
      borderRadius: 12,
      padding: '18px 20px 16px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: `0 0 24px ${tier.border}22, inset 0 1px 0 ${tier.border}33`,
    }}>
      {/* Corner accent */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 0, height: 0,
        borderStyle: 'solid',
        borderWidth: '0 60px 60px 0',
        borderColor: `transparent ${tier.border}22 transparent transparent`,
      }} />

      {/* Top row: OVR + POS + Dev badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{
            fontSize: 58, fontWeight: 900, color: tier.ovrColor,
            lineHeight: 1, letterSpacing: -2, fontFamily: 'monospace',
          }}>
            {ovr}
          </span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: tier.accent, letterSpacing: 3, lineHeight: 1 }}>
              {pos}
            </div>
            <div style={{ fontSize: 9, color: `${tier.accent}88`, letterSpacing: 2, marginTop: 2 }}>
              {tier.label}
            </div>
          </div>
        </div>

        {dev && (
          <div style={{
            background: `${dev.color}18`,
            border: `1px solid ${dev.color}55`,
            borderRadius: 6, padding: '4px 10px',
            textAlign: 'center',
          }}>
            <div style={{ color: dev.color, fontSize: 14, lineHeight: 1 }}>{dev.icon}</div>
            <div style={{ color: dev.color, fontSize: 8, fontWeight: 700, letterSpacing: 1, marginTop: 2 }}>{dev.label}</div>
          </div>
        )}
      </div>

      {/* Name */}
      <div style={{
        color: '#ffffff', fontSize: 22, fontWeight: 900,
        letterSpacing: 1, lineHeight: 1, marginBottom: 4,
        textShadow: `0 0 20px ${tier.border}66`,
      }}>
        {player.first_name[0]}. {player.last_name.toUpperCase()}
      </div>
      <div style={{ color: `${tier.accent}99`, fontSize: 11, marginBottom: 16, letterSpacing: 1 }}>
        AGE {player.age}
      </div>

      {/* Divider */}
      <div style={{
        height: 1,
        background: `linear-gradient(90deg, transparent, ${tier.border}66, transparent)`,
        marginBottom: 14,
      }} />

      {/* Attribute blocks */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${attrs.length}, 1fr)`, gap: 6 }}>
        {attrs.map(col => {
          const val = (player[col.key] as number) ?? 0;
          const color = val >= 90 ? '#FFD700' : val >= 80 ? '#4FC3F7' : val >= 70 ? '#81c784' : '#888';
          const pct = Math.min(100, Math.max(0, val));
          return (
            <div key={col.key as string} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 22, fontWeight: 900, color,
                lineHeight: 1, marginBottom: 4,
                textShadow: val >= 90 ? `0 0 12px ${color}88` : 'none',
              }}>
                {val}
              </div>
              <div style={{ height: 3, background: '#ffffff12', borderRadius: 2, marginBottom: 4, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 9, color: '#ffffff55', letterSpacing: 1, fontWeight: 700 }}>{col.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helper sub-components ───────────────────────────────────────────────────

function StatBox({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 60 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary }}>{value ?? '—'}</div>
      <div style={{ fontSize: 10, color: T.textSecondary, marginTop: 2 }}>{label}</div>
    </div>
  );
}

const tdStyle: React.CSSProperties = {
  padding: '5px 8px', borderBottom: '1px solid #1a1a1a', fontSize: 12, color: T.textSecondary,
};

function SeasonStatsRow({ s, position }: { s: CareerSeasonStats; position: string }) {
  if (DEF_POSITIONS.includes(position)) {
    return (
      <tr>
        <td style={tdStyle}>{s.season}</td>
        <td style={tdStyle}>{s.games}</td>
        <td style={tdStyle}>{(s.tackles ?? 0) + (s.assisted_tackles ?? 0)}</td>
        <td style={tdStyle}>{Number(s.sacks ?? 0).toFixed(1)}</td>
        <td style={tdStyle}>{s.tfl ?? 0}</td>
        <td style={tdStyle}>{s.def_interceptions ?? 0}</td>
        <td style={tdStyle}>{s.pass_deflections ?? 0}</td>
      </tr>
    );
  }
  if (position === 'QB') {
    return (
      <tr>
        <td style={tdStyle}>{s.season}</td>
        <td style={tdStyle}>{s.games}</td>
        <td style={tdStyle}>{s.pass_yards}</td>
        <td style={tdStyle}>{s.pass_tds}</td>
        <td style={tdStyle}>{s.interceptions}</td>
        <td style={tdStyle}>{s.pass_attempts > 0 ? `${Math.round((s.completions / s.pass_attempts) * 100)}%` : '—'}</td>
      </tr>
    );
  }
  if (position === 'RB') {
    return (
      <tr>
        <td style={tdStyle}>{s.season}</td>
        <td style={tdStyle}>{s.games}</td>
        <td style={tdStyle}>{s.rush_yards}</td>
        <td style={tdStyle}>{s.rush_tds}</td>
        <td style={tdStyle}>{s.rush_attempts > 0 ? (s.rush_yards / s.rush_attempts).toFixed(1) : '—'}</td>
        <td style={tdStyle}>{s.receptions} / {s.rec_yards}</td>
      </tr>
    );
  }
  if (position === 'K') {
    const fgPct = (s.fg_att ?? 0) > 0 ? `${Math.round(((s.fg_made ?? 0) / s.fg_att) * 100)}%` : '—';
    return (
      <tr>
        <td style={tdStyle}>{s.season}</td>
        <td style={tdStyle}>{s.games}</td>
        <td style={tdStyle}>{s.fg_made ?? 0}/{s.fg_att ?? 0}</td>
        <td style={tdStyle}>{fgPct}</td>
        <td style={tdStyle}>{s.xp_made ?? 0}/{s.xp_att ?? 0}</td>
      </tr>
    );
  }
  return (
    <tr>
      <td style={tdStyle}>{s.season}</td>
      <td style={tdStyle}>{s.games}</td>
      <td style={tdStyle}>{s.rec_yards}</td>
      <td style={tdStyle}>{s.rec_tds}</td>
      <td style={tdStyle}>{s.receptions}/{s.targets}</td>
      <td style={tdStyle}>{s.targets > 0 ? `${Math.round((s.receptions / s.targets) * 100)}%` : '—'}</td>
    </tr>
  );
}

// ─── Edit panel ───────────────────────────────────────────────────────────────

const DEV_TRAITS = ['Normal', 'Star', 'Superstar', 'X-Factor'] as const;
const TRAIT_COLOR: Record<string, string> = {
  Normal: '#9CA3AF', Star: '#4FC3F7', Superstar: '#C084FC', 'X-Factor': '#FFD700',
};

function RatingInput({ label, field, vals, onChange }: {
  label: string; field: keyof Player; vals: Partial<Player>;
  onChange: (field: keyof Player, val: number) => void;
}) {
  const val = (vals[field] as number) ?? 70;
  const color = val >= 90 ? '#FFD700' : val >= 80 ? '#4caf50' : val >= 70 ? '#FF8740' : '#888';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: T.textSecondary, fontSize: 10, letterSpacing: 1 }}>{label}</span>
        <span style={{ color, fontSize: 13, fontWeight: 700, minWidth: 26, textAlign: 'right' }}>{val}</span>
      </div>
      <input
        type="range" min={40} max={99} value={val}
        onChange={e => onChange(field, Number(e.target.value))}
        style={{ width: '100%', accentColor: color, cursor: 'pointer' }}
      />
    </div>
  );
}

function EditPanel({ player, onSave, onCancel }: {
  player: Player; onSave: (updated: Player) => void; onCancel: () => void;
}) {
  const [vals, setVals] = useState<Player>({ ...player });
  const [saving, setSaving] = useState(false);
  const attrCols = getRatingCols(vals.position_label || vals.position);

  const set = (field: keyof Player, val: any) =>
    setVals(prev => ({ ...prev, [field]: val }));

  const handleSave = async () => {
    setSaving(true);
    const result = await window.api.editPlayer({
      playerId: vals.id,
      overall_rating: vals.overall_rating,
      age: vals.age,
      dev_trait: vals.dev_trait,
      speed: vals.speed,
      strength: vals.strength,
      awareness: vals.awareness,
      throw_accuracy: vals.throw_accuracy,
      throw_power: vals.throw_power,
      catching: vals.catching,
      route_running: vals.route_running,
      tackle_rating: vals.tackle_rating,
      coverage: vals.coverage,
      pass_rush: vals.pass_rush,
      kickpower: vals.kickpower,
      kickaccuracy: vals.kickaccuracy,
      runblocking: vals.runblocking,
      passblocking: vals.passblocking,
    });
    setSaving(false);
    if (result?.success) onSave(vals);
  };

  const inputStyle: React.CSSProperties = {
    background: '#141414', border: '1px solid #2a2a2a', borderRadius: 4,
    color: '#ccc', padding: '5px 8px', fontSize: 13, width: 60,
  };

  return (
    <div style={{ padding: '14px 16px 16px' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: T.textSecondary, fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>OVR</div>
          <input type="number" min={40} max={99} value={vals.overall_rating}
            onChange={e => set('overall_rating', Number(e.target.value))}
            style={{ ...inputStyle, width: 54 }} />
        </div>
        <div>
          <div style={{ color: T.textSecondary, fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>AGE</div>
          <input type="number" min={18} max={45} value={vals.age}
            onChange={e => set('age', Number(e.target.value))}
            style={{ ...inputStyle, width: 54 }} />
        </div>
        <div>
          <div style={{ color: T.textSecondary, fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>DEV TRAIT</div>
          <select value={vals.dev_trait} onChange={e => set('dev_trait', e.target.value)}
            style={{
              background: '#141414', border: '1px solid #2a2a2a', borderRadius: 4,
              color: TRAIT_COLOR[vals.dev_trait] ?? '#ccc',
              padding: '5px 8px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
            {DEV_TRAITS.map(t => (
              <option key={t} value={t} style={{ color: TRAIT_COLOR[t] }}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', marginBottom: 20 }}>
        {attrCols.map(col => (
          <RatingInput key={col.key as string} label={col.label} field={col.key}
            vals={vals} onChange={(f, v) => set(f, v)} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSave} disabled={saving} style={{
          padding: '7px 20px', background: saving ? '#141414' : '#4caf50',
          border: 'none', borderRadius: 4, color: saving ? '#444' : '#000',
          fontWeight: 700, fontSize: 12, cursor: saving ? 'not-allowed' : 'pointer',
        }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        <button onClick={onCancel} style={{
          padding: '7px 16px', background: '#141414', border: '1px solid #2a2a2a',
          borderRadius: 4, color: '#555', fontSize: 12, cursor: 'pointer',
        }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  player: Player;
  playerStats: PlayerStats | null;
  careerStats: CareerSeasonStats[];
  statsView: 'season' | 'career';
  setStatsView: (v: 'season' | 'career') => void;
  onClose: () => void;
  onSave?: (updated: Player) => void;
}

export default function PlayerProfile({
  player, playerStats, careerStats, statsView, setStatsView, onClose, onSave,
}: Props) {
  const [editing, setEditing] = useState(false);
  const pos = player.position_label || player.position;

  const handleSave = (updated: Player) => {
    setEditing(false);
    onSave?.(updated);
  };

  return (
    <div style={{
      background: T.bgCard, border: `1px solid ${T.borderMid}`,
      borderRadius: 8, overflow: 'hidden', width: 360,
    }}>

      {/* Madden card */}
      <div style={{ padding: '16px 16px 0' }}>
        <MaddenCard player={player} />
      </div>

      {/* Action bar */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', gap: 8,
        padding: '10px 16px', borderBottom: `1px solid ${T.borderMid}`,
      }}>
        <button
          onClick={() => setEditing(e => !e)}
          style={{
            padding: '4px 14px',
            background: editing ? '#1a1000' : '#141414',
            border: `1px solid ${editing ? '#FF8740' : '#2a2a2a'}`,
            borderRadius: 4,
            color: editing ? '#FF8740' : '#555',
            fontSize: 11, fontWeight: editing ? 700 : 400,
            cursor: 'pointer',
          }}
        >
          {editing ? 'Editing…' : 'Edit'}
        </button>
        <button
          onClick={onClose}
          style={{
            background: '#141414', border: '1px solid #2a2a2a',
            borderRadius: 4, color: T.textSecondary,
            cursor: 'pointer', fontSize: 16, lineHeight: 1,
            padding: '4px 10px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Edit panel */}
      {editing && (
        <div style={{ borderBottom: `1px solid ${T.borderMid}` }}>
          <EditPanel player={player} onSave={handleSave} onCancel={() => setEditing(false)} />
        </div>
      )}

      {/* Season / Career stats */}
      {!editing && showStats(pos) && (
        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {(['season', 'career'] as const).map(v => (
              <button key={v} onClick={() => setStatsView(v)} style={{
                padding: '5px 14px', borderRadius: 4, border: 'none', cursor: 'pointer',
                background: statsView === v ? '#4FC3F7' : T.bgCard,
                color: statsView === v ? '#000' : T.textSecondary,
                fontWeight: statsView === v ? 'bold' : 'normal', fontSize: 12,
              }}>
                {v === 'season' ? 'This Season' : 'Career'}
              </button>
            ))}
          </div>

          {statsView === 'season' && (
            <>
              {!playerStats ? (
                <div style={{ color: T.textSecondary, fontSize: 12 }}>Loading...</div>
              ) : playerStats.games === 0 ? (
                <div style={{ color: T.textSecondary, fontSize: 12 }}>No stats this season</div>
              ) : (
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {pos === 'QB' && <>
                    <StatBox label="YDS" value={playerStats.pass_yards} />
                    <StatBox label="TD" value={playerStats.pass_tds} />
                    <StatBox label="INT" value={playerStats.interceptions} />
                    <StatBox label="CMP%" value={playerStats.pass_attempts > 0 ? `${Math.round((playerStats.completions / playerStats.pass_attempts) * 100)}%` : '—'} />
                  </>}
                  {pos === 'RB' && <>
                    <StatBox label="YDS" value={playerStats.rush_yards} />
                    <StatBox label="TD" value={playerStats.rush_tds} />
                    <StatBox label="YPC" value={playerStats.rush_attempts > 0 ? (playerStats.rush_yards / playerStats.rush_attempts).toFixed(1) : '—'} />
                    <StatBox label="REC" value={playerStats.receptions} />
                  </>}
                  {(pos === 'WR' || pos === 'TE') && <>
                    <StatBox label="REC" value={playerStats.receptions} />
                    <StatBox label="YDS" value={playerStats.rec_yards} />
                    <StatBox label="TD" value={playerStats.rec_tds} />
                    <StatBox label="TGT" value={playerStats.targets} />
                  </>}
                  {DEF_POSITIONS.includes(pos) && <>
                    <StatBox label="TKL" value={(playerStats.tackles ?? 0) + (playerStats.assisted_tackles ?? 0)} />
                    <StatBox label="SCK" value={Number(playerStats.sacks ?? 0).toFixed(1)} />
                    <StatBox label="TFL" value={playerStats.tfl ?? 0} />
                    <StatBox label="INT" value={playerStats.def_interceptions ?? 0} />
                    <StatBox label="PD" value={playerStats.pass_deflections ?? 0} />
                    <StatBox label="FF" value={playerStats.forced_fumbles ?? 0} />
                  </>}
                  {pos === 'K' && <>
                    <StatBox label="FG" value={`${playerStats.fg_made ?? 0}/${playerStats.fg_att ?? 0}`} />
                    <StatBox label="FG%" value={(playerStats.fg_att ?? 0) > 0 ? `${Math.round(((playerStats.fg_made ?? 0) / playerStats.fg_att) * 100)}%` : '—'} />
                    <StatBox label="XP" value={`${playerStats.xp_made ?? 0}/${playerStats.xp_att ?? 0}`} />
                  </>}
                </div>
              )}
            </>
          )}

          {statsView === 'career' && (
            <>
              {careerStats.length === 0 ? (
                <div style={{ color: T.textSecondary, fontSize: 12 }}>No career stats yet</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ ...tdStyle, color: T.textSecondary, textAlign: 'left' }}>Season</th>
                        <th style={{ ...tdStyle, color: T.textSecondary, textAlign: 'left' }}>G</th>
                        {getCareerHeaders(pos).map(h => (
                          <th key={h} style={{ ...tdStyle, color: T.textSecondary, textAlign: 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {careerStats.map((s, i) => (
                        <SeasonStatsRow key={i} s={s} position={pos} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!editing && !showStats(pos) && (
        <div style={{ padding: '14px 16px', color: T.textSecondary, fontSize: 12 }}>
          Stats not tracked for this position
        </div>
      )}
    </div>
  );
}
