import React, { useEffect, useState } from 'react';

declare const window: any;

interface Team {
  id: number;
  city: string;
  name: string;
  conference: string;
}

interface Player {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  position_label: string;
  overall_rating: number;
  age: number;
  dev_trait: string;
}

interface TeamStatus {
  status: string;
  description: string;
  acceptanceThreshold: number;
  wins: number;
  losses: number;
  avgOverall: number;
}

interface TradeResult {
  accepted: boolean;
  reason?: string;
}

interface Props {
  userTeam: { id: number; city: string; name: string };
}

const POSITIONS = ['ALL', 'QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K'];

const STATUS_META: Record<string, { color: string; bg: string }> = {
  Contender:  { color: '#FFD700', bg: '#1a1500' },
  Buyer:      { color: '#4caf50', bg: '#0a1a0a' },
  Seller:     { color: '#4FC3F7', bg: '#001a2a' },
  Rebuilding: { color: '#9E9E9E', bg: '#141414' },
  Neutral:    { color: '#FF8740', bg: '#1a0f00' },
};

const TRAIT_META: Record<string, { color: string }> = {
  'Normal':    { color: '#444'    },
  'Star':      { color: '#4FC3F7' },
  'Superstar': { color: '#FF8740' },
  'X-Factor':  { color: '#FFD700' },
};

function ratingColor(r: number): string {
  if (r >= 90) return '#FFD700';
  if (r >= 80) return '#4caf50';
  if (r >= 70) return '#FF8740';
  return '#888';
}

function calcTradeValue(overall: number, age: number, position: string, devTrait: string = 'Normal'): number {
  const ageFactor =
    age <= 23 ? 1.4 :
    age <= 26 ? 1.25 :
    age <= 29 ? 1.0 :
    age <= 32 ? 0.75 :
    age <= 35 ? 0.5 : 0.3;

  const posFactor: Record<string, number> = {
    QB: 1.4, CB: 1.15, DL: 1.15, LB: 1.1,
    WR: 1.1, TE: 1.1, OL: 1.05, S: 1.0, RB: 0.85, K: 0.7,
  };

  const traitFactor: Record<string, number> = {
    'Normal': 1.0, 'Star': 1.15, 'Superstar': 1.3, 'X-Factor': 1.5,
  };

  return Math.round(overall * ageFactor * (posFactor[position] ?? 1.0) * (traitFactor[devTrait] ?? 1.0));
}

function trajectory(age: number): { label: string; color: string } {
  if (age <= 26) return { label: '↑ Rising',   color: '#4caf50' };
  if (age <= 30) return { label: '→ Prime',     color: '#FF8740' };
  return              { label: '↓ Declining', color: '#777'    };
}

export default function Trades({ userTeam }: Props) {
  const [teams, setTeams]                   = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [teamStatus, setTeamStatus]         = useState<TeamStatus | null>(null);
  const [myRoster, setMyRoster]             = useState<Player[]>([]);
  const [theirRoster, setTheirRoster]       = useState<Player[]>([]);
  const [mySelected, setMySelected]         = useState<number[]>([]);
  const [theirSelected, setTheirSelected]   = useState<number[]>([]);
  const [myPos, setMyPos]                   = useState('ALL');
  const [theirPos, setTheirPos]             = useState('ALL');
  const [result, setResult]                 = useState<TradeResult | null>(null);
  const [proposing, setProposing]           = useState(false);

  useEffect(() => {
    Promise.all([
      window.api.getTeams(),
      window.api.getRoster(userTeam.id),
    ]).then(([allTeams, roster]: [Team[], Player[]]) => {
      setTeams(allTeams.filter(t => t.id !== userTeam.id));
      setMyRoster(roster);
    });
  }, [userTeam.id]);

  const handleSelectTeam = async (teamId: number) => {
    setSelectedTeamId(teamId);
    setMySelected([]);
    setTheirSelected([]);
    setResult(null);
    setTeamStatus(null);
    const [roster, status] = await Promise.all([
      window.api.getRoster(teamId),
      window.api.getTeamStatus(teamId),
    ]);
    setTheirRoster(roster);
    setTeamStatus(status);
  };

  const toggleMine = (id: number) => {
    setResult(null);
    setMySelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleTheirs = (id: number) => {
    setResult(null);
    setTheirSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handlePropose = async () => {
    if (!canPropose) return;
    setProposing(true);
    const res = await window.api.proposeTrade({
      myPlayerIds: mySelected,
      theirPlayerIds: theirSelected,
      theirTeamId: selectedTeamId!,
    });
    setResult(res);
    if (res.accepted) {
      const [myNew, theirNew] = await Promise.all([
        window.api.getRoster(userTeam.id),
        window.api.getRoster(selectedTeamId!),
      ]);
      setMyRoster(myNew);
      setTheirRoster(theirNew);
      setMySelected([]);
      setTheirSelected([]);
    }
    setProposing(false);
  };

  const myFiltered    = myRoster.filter(p => myPos === 'ALL' || p.position === myPos);
  const theirFiltered = theirRoster.filter(p => theirPos === 'ALL' || p.position === theirPos);

  const myValue = mySelected.reduce((s, id) => {
    const p = myRoster.find(x => x.id === id);
    return s + (p ? calcTradeValue(p.overall_rating, p.age, p.position, p.dev_trait) : 0);
  }, 0);

  const theirValue = theirSelected.reduce((s, id) => {
    const p = theirRoster.find(x => x.id === id);
    return s + (p ? calcTradeValue(p.overall_rating, p.age, p.position, p.dev_trait) : 0);
  }, 0);

  const canPropose   = mySelected.length > 0 && theirSelected.length > 0 && selectedTeamId !== null;
  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const statusMeta   = STATUS_META[teamStatus?.status ?? ''] ?? STATUS_META['Neutral'];

  const threshold  = teamStatus?.acceptanceThreshold ?? -8;
  const margin     = (theirValue - myValue) - threshold;
  const likelihood =
    !canPropose   ? 'idle' :
    margin >= 5   ? 'yes' :
    margin >= -5  ? 'maybe' : 'no';

  const likelihoodText: Record<string, string> = {
    idle:  'Select players from both sides to propose',
    yes:   `✓ ${teamStatus?.status ?? 'CPU'} will likely accept`,
    maybe: '~ Borderline — may accept or decline',
    no:    `✗ ${teamStatus?.status ?? 'CPU'} will likely decline — offer more value`,
  };
  const likelihoodColor: Record<string, string> = {
    idle: '#333', yes: '#4caf50', maybe: '#FF8740', no: '#e57373',
  };

  return (
    <div style={{ padding: 20, color: '#fff', fontFamily: 'sans-serif', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #1e1e1e' }}>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: '#FF8740', marginBottom: 10 }}>
          Trade Center
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#666' }}>Trade with:</span>
          <select
            value={selectedTeamId ?? ''}
            onChange={e => e.target.value && handleSelectTeam(Number(e.target.value))}
            style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 5, color: '#ccc', padding: '6px 12px', fontSize: 13, cursor: 'pointer' }}
          >
            <option value="">— Select a team —</option>
            {(['AFC', 'NFC'] as const).map(conf => (
              <optgroup key={conf} label={conf}>
                {teams.filter(t => t.conference === conf).map(t => (
                  <option key={t.id} value={t.id}>{t.city} {t.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {!selectedTeamId ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#2a2a2a' }}>
          <div style={{ fontSize: 14 }}>Select a team above to build a trade.</div>
        </div>
      ) : (
        <>
          {/* Team Status Banner */}
          {teamStatus && (
            <div style={{
              background: statusMeta.bg,
              border: `1px solid ${statusMeta.color}30`,
              borderRadius: 8, padding: '12px 16px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 'bold', color: '#fff' }}>
                    {selectedTeam?.city} {selectedTeam?.name}
                  </span>
                  <span style={{
                    background: statusMeta.color, color: '#000',
                    fontSize: 9, fontWeight: 'bold',
                    padding: '2px 7px', borderRadius: 3, letterSpacing: 0.8,
                  }}>
                    {teamStatus.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>{teamStatus.description}</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 13, color: '#ccc', fontWeight: 'bold' }}>
                  {teamStatus.wins}–{teamStatus.losses}
                </div>
                <div style={{ fontSize: 11, color: '#555' }}>
                  Avg OVR: <span style={{ color: ratingColor(teamStatus.avgOverall) }}>{teamStatus.avgOverall}</span>
                </div>
              </div>
            </div>
          )}

          {/* Two-panel roster builder */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <RosterPanel
              title={`${userTeam.city} ${userTeam.name}`}
              subtitle="Select players to offer"
              players={myFiltered}
              selected={mySelected}
              posFilter={myPos}
              onPosFilter={setMyPos}
              onToggle={toggleMine}
              accent="#4FC3F7"
            />
            <RosterPanel
              title={`${selectedTeam?.city} ${selectedTeam?.name}`}
              subtitle="Select players to request"
              players={theirFiltered}
              selected={theirSelected}
              posFilter={theirPos}
              onPosFilter={setTheirPos}
              onToggle={toggleTheirs}
              accent={statusMeta.color}
            />
          </div>

          {/* Trade summary bar */}
          <div style={{ background: '#0e0e0e', border: '1px solid #1e1e1e', borderRadius: 8, padding: '14px 16px' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, marginBottom: 14, alignItems: 'start' }}>

              {/* You offer */}
              <div>
                <div style={{ fontSize: 10, color: '#555', letterSpacing: 1, marginBottom: 6 }}>YOU OFFER</div>
                {mySelected.length === 0
                  ? <div style={{ fontSize: 12, color: '#333' }}>No players selected</div>
                  : mySelected.map(id => {
                      const p = myRoster.find(x => x.id === id);
                      return p ? (
                        <div key={id} style={{ fontSize: 12, color: '#ccc', marginBottom: 3 }}>
                          {p.first_name} {p.last_name}
                          {p.dev_trait && p.dev_trait !== 'Normal' && (
                            <span style={{ color: TRAIT_META[p.dev_trait]?.color, fontWeight: 'bold' }}> · {p.dev_trait}</span>
                          )}
                          <span style={{ color: '#444' }}> · {p.position_label || p.position} · </span>
                          <span style={{ color: ratingColor(p.overall_rating) }}>{p.overall_rating} OVR</span>
                          <span style={{ color: '#4FC3F7' }}> · {calcTradeValue(p.overall_rating, p.age, p.position, p.dev_trait)} val</span>
                        </div>
                      ) : null;
                    })}
                {mySelected.length > 0 && (
                  <div style={{ fontSize: 11, color: '#4FC3F7', marginTop: 6, fontWeight: 'bold' }}>
                    Total Value: {myValue}
                  </div>
                )}
              </div>

              <div style={{ fontSize: 20, color: '#2a2a2a', alignSelf: 'center' }}>⇄</div>

              {/* You receive */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: '#555', letterSpacing: 1, marginBottom: 6 }}>YOU RECEIVE</div>
                {theirSelected.length === 0
                  ? <div style={{ fontSize: 12, color: '#333' }}>No players selected</div>
                  : theirSelected.map(id => {
                      const p = theirRoster.find(x => x.id === id);
                      return p ? (
                        <div key={id} style={{ fontSize: 12, color: '#ccc', marginBottom: 3 }}>
                          {p.first_name} {p.last_name}
                          {p.dev_trait && p.dev_trait !== 'Normal' && (
                            <span style={{ color: TRAIT_META[p.dev_trait]?.color, fontWeight: 'bold' }}> · {p.dev_trait}</span>
                          )}
                          <span style={{ color: '#444' }}> · {p.position_label || p.position} · </span>
                          <span style={{ color: ratingColor(p.overall_rating) }}>{p.overall_rating} OVR</span>
                          <span style={{ color: statusMeta.color }}> · {calcTradeValue(p.overall_rating, p.age, p.position, p.dev_trait)} val</span>
                        </div>
                      ) : null;
                    })}
                {theirSelected.length > 0 && (
                  <div style={{ fontSize: 11, color: statusMeta.color, marginTop: 6, fontWeight: 'bold' }}>
                    Total Value: {theirValue}
                  </div>
                )}
              </div>
            </div>

            {/* Value bar */}
            {canPropose && myValue > 0 && theirValue > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 3, height: 4, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ flex: myValue, background: '#4FC3F7', borderRadius: 2, transition: 'flex 0.3s' }} />
                  <div style={{ flex: theirValue, background: statusMeta.color, borderRadius: 2, transition: 'flex 0.3s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                  <span style={{ fontSize: 10, color: '#4FC3F7' }}>You give: {myValue}</span>
                  <span style={{ fontSize: 10, color: statusMeta.color }}>You get: {theirValue}</span>
                </div>
              </div>
            )}

            {/* Likelihood + propose */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 12, color: likelihoodColor[likelihood] }}>
                {likelihoodText[likelihood]}
              </div>
              <button
                onClick={handlePropose}
                disabled={!canPropose || proposing}
                style={{
                  padding: '9px 20px',
                  background: !canPropose || proposing ? '#1a1a1a' : '#FF8740',
                  border: 'none', borderRadius: 5,
                  color: !canPropose || proposing ? '#444' : '#000',
                  fontWeight: 'bold', fontSize: 13,
                  cursor: !canPropose || proposing ? 'not-allowed' : 'pointer',
                }}
              >
                {proposing ? 'Proposing...' : 'Propose Trade'}
              </button>
            </div>

            {result && (
              <div style={{
                marginTop: 12, padding: '10px 14px',
                background: result.accepted ? '#0a1a0a' : '#1a0a0a',
                border: `1px solid ${result.accepted ? '#1a4a1a' : '#4a1a1a'}`,
                borderRadius: 6, fontSize: 13,
                color: result.accepted ? '#4caf50' : '#e57373',
              }}>
                {result.accepted ? '✓ Trade accepted! Rosters updated.' : `✗ ${result.reason}`}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Roster Panel ─────────────────────────────────────────────────────────────

interface RosterPanelProps {
  title: string;
  subtitle: string;
  players: Player[];
  selected: number[];
  posFilter: string;
  onPosFilter: (p: string) => void;
  onToggle: (id: number) => void;
  accent: string;
}

function RosterPanel({ title, subtitle, players, selected, posFilter, onPosFilter, onToggle, accent }: RosterPanelProps) {
  return (
    <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #1a1a1a' }}>
        <div style={{ fontSize: 11, fontWeight: 'bold', color: accent, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 10, color: '#444', marginBottom: 8 }}>{subtitle}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {POSITIONS.map(pos => (
            <button
              key={pos}
              onClick={() => onPosFilter(pos)}
              style={{
                padding: '2px 7px',
                background: posFilter === pos ? accent : '#141414',
                border: `1px solid ${posFilter === pos ? accent : '#222'}`,
                borderRadius: 3,
                color: posFilter === pos ? '#000' : '#555',
                fontSize: 10, cursor: 'pointer',
                fontWeight: posFilter === pos ? 'bold' : 'normal',
              }}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxHeight: 360, overflowY: 'auto', padding: '8px 10px' }}>
        {players.length === 0 ? (
          <div style={{ color: '#333', fontSize: 12, textAlign: 'center', padding: 20 }}>No players</div>
        ) : (
          players.map(player => {
            const isSelected = selected.includes(player.id);
            const traj = trajectory(player.age);
            const val  = calcTradeValue(player.overall_rating, player.age, player.position, player.dev_trait);
            const traitColor = TRAIT_META[player.dev_trait]?.color ?? '#444';
            const showTrait  = player.dev_trait && player.dev_trait !== 'Normal';
            return (
              <div
                key={player.id}
                onClick={() => onToggle(player.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 8px', marginBottom: 3,
                  background: isSelected ? '#0a0e18' : '#141414',
                  border: `1px solid ${isSelected ? accent : '#1e1e1e'}`,
                  borderRadius: 4, cursor: 'pointer',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 12, color: isSelected ? '#fff' : '#ccc', fontWeight: isSelected ? '700' : '400' }}>
                      {player.first_name} {player.last_name}
                    </span>
                    {showTrait && (
                      <span style={{
                        fontSize: 8, fontWeight: 'bold', color: '#000',
                        background: traitColor,
                        padding: '1px 5px', borderRadius: 2, letterSpacing: 0.3,
                      }}>
                        {player.dev_trait === 'X-Factor' ? 'XF' :
                         player.dev_trait === 'Superstar' ? 'SS' : 'S'}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, display: 'flex', gap: 8, marginTop: 1 }}>
                    <span style={{ color: '#555' }}>{player.position_label || player.position} · Age {player.age}</span>
                    <span style={{ color: traj.color }}>{traj.label}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 'bold', color: ratingColor(player.overall_rating) }}>
                    {player.overall_rating}
                  </div>
                  <div style={{ fontSize: 10, color: accent }}>
                    {val} val
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selected.length > 0 && (
        <div style={{ padding: '6px 14px', borderTop: '1px solid #1a1a1a', fontSize: 11, color: accent }}>
          {selected.length} player{selected.length > 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
}