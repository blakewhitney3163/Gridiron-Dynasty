import React, { useEffect, useState } from 'react';
import { T } from './theme';
import { Prospect, DraftTeam, PickSlot, MyPick, CpuPick } from './draft/types';
import { draftGrade, POSITION_ATTRS, gradeColor } from './draft/draftUtils';
import ProspectBoard from './draft/ProspectBoard';
import MyPicksSidebar from './draft/MyPicksSidebar';
import DraftSummary from './draft/DraftSummary';
import CombineView from './draft/CombineView';
import { useGameStore } from './store/gameStore';

declare const window: any;

interface Props {
  onDraftComplete: () => void;
}


export default function Draft({ onDraftComplete }: Props) {
  const { userTeam, currentSeason, playoffsComplete } = useGameStore();

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [draftOrder, setDraftOrder] = useState<DraftTeam[]>([]);
  const [roundPickSlots, setRoundPickSlots] = useState<PickSlot[]>([]);
  const [userPickSlots, setUserPickSlots] = useState<number[]>([]);
  const [currentPickIdx, setCurrentPickIdx] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [myPicks, setMyPicks] = useState<MyPick[]>([]);
  const [lastCpuPicks, setLastCpuPicks] = useState<CpuPick[]>([]);
  const [posFilter, setPosFilter] = useState('ALL');
  const [draftGenerated, setDraftGenerated] = useState(false);
  const [draftFinished, setDraftFinished] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [running, setRunning] = useState(false);
  const [scoutPoints, setScoutPoints] = useState(0);
  const [revealingAttr, setRevealingAttr] = useState<string | null>(null); // "prospectId:attr"
  const [classStrength, setClassStrength] = useState<Record<string, number> | null>(null);
  const [combineViewed, setCombineViewed] = useState(false);

  // In-draft trade modal state
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeMyPickAssetId, setTradeMyPickAssetId] = useState<number | null>(null);
  const [tradeTheirTeamId, setTradeTheirTeamId] = useState<number | null>(null);
  const [tradeTheirPickAssetId, setTradeTheirPickAssetId] = useState<number | null>(null);
  const [tradeResult, setTradeResult] = useState<{ accepted: boolean; reason?: string } | null>(null);
  const [tradingPick, setTradingPick] = useState(false);

  useEffect(() => { loadDraft(); }, [userTeam?.id]);

  const loadDraft = async () => {
    const [cls, order, sc, cs] = await Promise.all([
      window.api.getDraftClass(),
      window.api.getDraftOrder(),
      window.api.getScoutCount(),
      window.api.getDraftClassStrength(),
    ]);
    setProspects(cls);
    setDraftOrder(order);
    setScoutPoints(sc?.budget ?? 25);
    setDraftGenerated(cls.length > 0);
    if (cs && typeof cs === 'object' && !cs.error) {
      setClassStrength(cs);
    }

    const drafted = cls.filter((p: Prospect) => p.is_drafted);
    const roundsDone = Math.floor(drafted.length / 32);
    if (roundsDone >= 7) {
      setDraftFinished(true);
      setCurrentRound(7);
    } else {
      const round = roundsDone + 1;
      setCurrentRound(round);
      await loadRoundSlots(round);
    }
    const mine = cls.filter((p: Prospect) => p.is_drafted && p.drafted_by_team_id === userTeam.id);
    setMyPicks(mine.map((p: Prospect) => {
      const gradeInfo = draftGrade(p.overall_rating);
      return {
        round: p.draft_round!,
        slot: (p.draft_pick! - 1) % 32 + 1,
        player: p,
        grade: gradeInfo.grade,
        gradeColor: gradeInfo.color,
      };
    }));
  };

  const loadRoundSlots = async (round: number) => {
    if (!userTeam) return;
    const slots: PickSlot[] = await window.api.getRoundPickOrder({ round });
    setRoundPickSlots(slots);
    const userSlots = slots
      .filter(slot => slot.ownerTeamId === userTeam.id && !slot.isUsed)
      .map(slot => slot.slot);
    setUserPickSlots(userSlots);
    setCurrentPickIdx(0);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    await window.api.generateDraftClass();
    await loadDraft();
    setGenerating(false);
  };

  const handleScoutAttr = async (prospectId: number, attribute: string) => {
    if (scoutPoints <= 0 || revealingAttr !== null) return;
    const key = `${prospectId}:${attribute}`;
    setRevealingAttr(key);
    const result = await window.api.scoutProspectAttr({ prospectId, attribute });
    if (result.success) {
      setScoutPoints(result.remaining);
      setProspects(await window.api.getDraftClass());
    }
    setRevealingAttr(null);
  };

  // Legacy — kept for ProspectBoard compat (draft day no longer needs it)
  const handleScout = async (_prospectId: number) => {};

  const handlePick = async (prospect: Prospect) => {
    if (running || !userTeam) return;
    setRunning(true);
    const slot = userPickSlots[currentPickIdx] ?? 1;
    const overallPick = (currentRound - 1) * 32 + slot;
    await window.api.makeDraftPick({
      prospectId: prospect.id,
      teamId: userTeam.id,
      round: currentRound,
      pick: overallPick,
    });

    const gradeInfo = draftGrade(prospect.overall_rating);
    setMyPicks(prev => [...prev, {
      round: currentRound,
      slot,
      player: prospect,
      grade: gradeInfo.grade,
      gradeColor: gradeInfo.color,
    }]);

    if (currentPickIdx < userPickSlots.length - 1) {
      setProspects(await window.api.getDraftClass());
      setCurrentPickIdx(prev => prev + 1);
      setRunning(false);
      return;
    }

    const cpuResults: CpuPick[] = await window.api.runCpuRound({
      round: currentRound,
      userTeamId: userTeam.id,
    });
    setLastCpuPicks(cpuResults);
    setProspects(await window.api.getDraftClass());
    setShowResults(true);
    setRunning(false);
  };

  const handleAutoPick = () => {
    const bestProspect = prospects.find(p => !p.is_drafted && (posFilter === 'ALL' || p.position === posFilter));
    if (bestProspect) {
      handlePick(bestProspect);
    }
  };

  const handleNextRound = async () => {
    if (currentRound >= 7) {
      setDraftFinished(true);
      return;
    }
    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);
    setShowResults(false);
    setLastCpuPicks([]);
    await loadRoundSlots(nextRound);
  };

  const handleCompleteDraft = async () => {
    setRunning(true);
    await window.api.completeDraft();
    setRunning(false);
    onDraftComplete();
  };

  const openTradeModal = () => {
    setTradeMyPickAssetId(null);
    setTradeTheirTeamId(null);
    setTradeTheirPickAssetId(null);
    setTradeResult(null);
    setShowTradeModal(true);
  };

  const handleProposeTrade = async () => {
    if (!userTeam || !tradeMyPickAssetId || !tradeTheirPickAssetId || !tradeTheirTeamId) return;
    setTradingPick(true);
    setTradeResult(null);
    const result = await window.api.proposeDraftTrade({
      userTeamId: userTeam.id,
      myPickId: tradeMyPickAssetId,
      theirTeamId: tradeTheirTeamId,
      theirPickId: tradeTheirPickAssetId,
    });
    setTradeResult(result);
    setTradingPick(false);
    if (result.accepted) {
      await loadRoundSlots(currentRound);
    }
  };

  if (!userTeam) return null;

  const available = prospects.filter(p => !p.is_drafted && (posFilter === 'ALL' || p.position === posFilter));
  const pickNum = userPickSlots[currentPickIdx];
  const totalPicksThisRound = userPickSlots.length;

  const myTradableSlots = roundPickSlots.filter(
    slot => slot.ownerTeamId === userTeam.id && !slot.isUsed && slot.pickAssetId !== null,
  );
  const cpuTeamIds = [...new Set(
    roundPickSlots
      .filter(slot => slot.ownerTeamId !== userTeam.id && !slot.isUsed)
      .map(slot => slot.ownerTeamId),
  )];
  const theirSlots = tradeTheirTeamId !== null
    ? roundPickSlots.filter(slot => slot.ownerTeamId === tradeTheirTeamId && !slot.isUsed && slot.pickAssetId !== null)
    : [];

  if (!draftGenerated) {
    return (
      <div style={{ padding: '40px 24px', maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: T.textPrimary, marginBottom: 12 }}>
          {currentSeason} Draft Scouting
        </div>
        <div style={{ color: T.textDim, fontSize: 13, marginBottom: 24 }}>
          The draft class will be auto-generated when you generate your season schedule.
          Come back once the season is underway to start scouting prospects.
        </div>
      </div>
    );
  }

  if (draftFinished) {
    return (
      <DraftSummary
        myPicks={myPicks}
        userTeam={userTeam}
        currentSeason={currentSeason}
        onComplete={handleCompleteDraft}
        running={running}
      />
    );
  }

  if (!playoffsComplete) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary }}>
              {currentSeason} Draft — Scouting Season
            </div>
            <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>
              Draft opens after playoffs · {prospects.filter(p => !p.is_drafted).length} prospects available
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: T.textDim, letterSpacing: 1 }}>SCOUT POINTS</div>
            <div style={{
              color: scoutPoints >= 5 ? '#4caf50' : scoutPoints > 0 ? '#FF8740' : '#e57373',
              fontWeight: 700, fontSize: 20,
            }}>
              {scoutPoints}
            </div>
            <div style={{ fontSize: 9, color: T.textDim }}>1 pt per attribute reveal · earn by simming games</div>
          </div>
        </div>

        {/* Tip banner */}
        <div style={{
          background: '#0a1000', border: '1px solid #1a2a1a', borderRadius: 6,
          padding: '9px 14px', marginBottom: 12, fontSize: 11, color: '#4caf50',
        }}>
          Spend scout points to reveal attribute grades for individual prospects. Each reveal costs 1 point.
          Combine stats will be public after playoffs — come back then to see athletic testing.
        </div>

        {/* Position filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {['ALL', 'QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P'].map(pos => (
            <button
              key={pos}
              onClick={() => setPosFilter(pos)}
              style={{
                padding: '3px 10px', fontSize: 10, cursor: 'pointer', borderRadius: 3,
                background: posFilter === pos ? '#FF8740' : '#141414',
                border: `1px solid ${posFilter === pos ? '#FF8740' : '#222'}`,
                color: posFilter === pos ? '#000' : '#555',
              }}
            >
              {pos}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {prospects
            .filter(p => !p.is_drafted && (posFilter === 'ALL' || p.position === posFilter))
            .slice(0, 80)
            .map(p => {
              const proj = p.projected_overall_pick ?? 0;
              const projRound = proj > 0 ? Math.ceil(proj / 32) : null;
              const projPick  = proj > 0 ? ((proj - 1) % 32) + 1 : null;
              const projLabel = projRound != null ? `Rd ${projRound}, ~${projPick}` : '—';
              const attrs: Record<string, string> = JSON.parse(p.attributes_json ?? '{}');
              const revealed: string[] = JSON.parse(p.revealed_attrs ?? '[]');
              const posAttrs = POSITION_ATTRS[p.position] ?? [];

              return (
                <div key={p.id} style={{
                  padding: '10px 14px', marginBottom: 6, borderRadius: 6,
                  background: '#0e0e0e', border: '1px solid #1a1a1a',
                }}>
                  {/* Prospect header row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700, color: T.textPrimary, flex: 1,
                    }}>
                      {p.first_name} {p.last_name}
                      <span style={{ color: '#555', marginLeft: 8, fontSize: 10, fontWeight: 400 }}>
                        {p.position} · Age {p.age}
                      </span>
                    </span>
                    <span style={{ fontSize: 10, color: '#4a6a4a', minWidth: 80, textAlign: 'right' }}>
                      {projLabel}
                    </span>
                  </div>

                  {/* Attribute chips */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {posAttrs.map(attr => {
                      const isRevealed = revealed.includes(attr);
                      const grade = attrs[attr] ?? '?';
                      const revKey = `${p.id}:${attr}`;
                      const isWorking = revealingAttr === revKey;

                      if (isRevealed) {
                        return (
                          <div key={attr} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            padding: '4px 8px', borderRadius: 5,
                            background: '#111', border: `1px solid ${gradeColor(grade)}44`,
                            minWidth: 52,
                          }}>
                            <span style={{ fontSize: 8, color: '#555', marginBottom: 1 }}>{attr}</span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: gradeColor(grade) }}>
                              {grade}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={attr}
                          onClick={() => handleScoutAttr(p.id, attr)}
                          disabled={scoutPoints <= 0 || revealingAttr !== null}
                          title={scoutPoints <= 0 ? 'No scout points remaining' : `Reveal ${attr} (1 pt)`}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            padding: '4px 8px', borderRadius: 5, cursor: scoutPoints > 0 ? 'pointer' : 'not-allowed',
                            background: '#0c0c0c', border: '1px solid #2a2a2a',
                            minWidth: 52, gap: 1,
                          }}
                        >
                          <span style={{ fontSize: 8, color: '#444' }}>{attr}</span>
                          <span style={{ fontSize: 13, color: '#333' }}>
                            {isWorking ? '…' : '🔒'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  }

  // After playoffs: show Combine before Draft
  if (!combineViewed) {
    return <CombineView onComplete={() => setCombineViewed(true)} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px 24px' }}>
      {/* Draft Day Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary }}>
            {currentSeason} NFL Draft
          </div>
          <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>
            Round {currentRound} of 7 &nbsp;·&nbsp; {available.length} prospects available
            {totalPicksThisRound > 1 && !showResults && (
              <span style={{ color: '#FF8740', marginLeft: 8 }}>
                You have {totalPicksThisRound} picks this round (Pick {currentPickIdx + 1} of {totalPicksThisRound})
              </span>
            )}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          {myTradableSlots.length > 0 && !showResults && !running && (
            <button
              onClick={openTradeModal}
              style={{
                padding: '5px 14px', fontSize: 11, cursor: 'pointer', borderRadius: 4,
                background: '#0d1a2a', border: '1px solid #1a4060',
                color: '#4FC3F7', fontFamily: 'monospace',
              }}
            >
              🔄 Trade Pick
            </button>
          )}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: T.textDim, letterSpacing: 1 }}>SCOUT PTS</div>
            <div style={{
              color: scoutPoints >= 5 ? '#4caf50' : scoutPoints > 0 ? '#FF8740' : '#e57373',
              fontWeight: 700,
              fontSize: 16,
            }}>
              {scoutPoints}
            </div>
          </div>
        </div>
      </div>

      {/* CPU drafting spinner */}
      {running && !showResults && (
        <div style={{
          margin: '0 0 12px', padding: '12px 18px', borderRadius: 6,
          background: '#0d1a10', border: '1px solid #2a4a2a',
          color: '#4caf50', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>⏳</span>
          <span>CPU teams are drafting… please wait.</span>
        </div>
      )}

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', overflow: 'hidden' }}>
        <ProspectBoard
          available={available}
          posFilter={posFilter}
          setPosFilter={setPosFilter}
          showResults={showResults}
          userPickSlots={userPickSlots}
          currentPickIdx={currentPickIdx}
          currentRound={currentRound}
          pickNum={pickNum}
          totalPicksThisRound={totalPicksThisRound}
          myPicks={myPicks}
          lastCpuPicks={lastCpuPicks}
          roundPickSlots={roundPickSlots}
          draftOrder={draftOrder}
          scoutsLeft={scoutPoints}
          scouting={null}
          running={running}
          userTeam={userTeam}
          onPick={handlePick}
          onAutoPick={handleAutoPick}
          onScout={handleScout}
          onNextRound={handleNextRound}
          currentSeason={currentSeason}
        />
        <MyPicksSidebar
          myPicks={myPicks}
          currentRound={currentRound}
          roundPickSlots={roundPickSlots}
          draftOrder={draftOrder}
          userTeam={userTeam}
        />
      </div>

      {/* In-Draft Trade Modal */}
      {showTradeModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#111', border: '1px solid #2a2a2a', borderRadius: 8,
            padding: 28, width: 480, maxWidth: '90vw',
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, marginBottom: 4 }}>
              Propose Pick Trade — Round {currentRound}
            </div>
            <div style={{ fontSize: 11, color: T.textDim, marginBottom: 20 }}>
              Offer one of your picks in exchange for a CPU team's pick this round.
            </div>

            {/* Your pick */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: T.textDim, letterSpacing: 1, marginBottom: 6 }}>YOUR PICK TO OFFER</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {myTradableSlots.map(slot => (
                  <button
                    key={slot.pickAssetId}
                    onClick={() => setTradeMyPickAssetId(slot.pickAssetId)}
                    style={{
                      padding: '5px 14px', fontSize: 11, cursor: 'pointer', borderRadius: 4,
                      background: tradeMyPickAssetId === slot.pickAssetId ? '#FF8740' : '#1a1a1a',
                      border: `1px solid ${tradeMyPickAssetId === slot.pickAssetId ? '#FF8740' : '#333'}`,
                      color: tradeMyPickAssetId === slot.pickAssetId ? '#000' : '#aaa',
                    }}
                  >
                    Round {currentRound}, Pick {slot.slot}
                  </button>
                ))}
              </div>
            </div>

            {/* CPU team */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: T.textDim, letterSpacing: 1, marginBottom: 6 }}>SELECT CPU TEAM</div>
              <select
                value={tradeTheirTeamId ?? ''}
                onChange={e => {
                  setTradeTheirTeamId(e.target.value ? Number(e.target.value) : null);
                  setTradeTheirPickAssetId(null);
                }}
                style={{
                  background: '#1a1a1a', border: '1px solid #333', color: '#ccc',
                  padding: '6px 10px', borderRadius: 4, fontSize: 12, width: '100%',
                }}
              >
                <option value="">— Choose a team —</option>
                {cpuTeamIds.map(teamId => {
                  const slot = roundPickSlots.find(s => s.ownerTeamId === teamId);
                  return (
                    <option key={teamId} value={teamId}>
                      {slot ? `${slot.ownerCity} ${slot.ownerName}` : `Team ${teamId}`}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Their pick */}
            {tradeTheirTeamId !== null && theirSlots.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: T.textDim, letterSpacing: 1, marginBottom: 6 }}>
                  THEIR PICK YOU WANT
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {theirSlots.map(slot => (
                    <button
                      key={slot.pickAssetId}
                      onClick={() => setTradeTheirPickAssetId(slot.pickAssetId)}
                      style={{
                        padding: '5px 14px', fontSize: 11, cursor: 'pointer', borderRadius: 4,
                        background: tradeTheirPickAssetId === slot.pickAssetId ? '#4FC3F7' : '#1a1a1a',
                        border: `1px solid ${tradeTheirPickAssetId === slot.pickAssetId ? '#4FC3F7' : '#333'}`,
                        color: tradeTheirPickAssetId === slot.pickAssetId ? '#000' : '#aaa',
                      }}
                    >
                      Round {currentRound}, Pick {slot.slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Result */}
            {tradeResult && (
              <div style={{
                padding: '10px 14px', borderRadius: 5, marginBottom: 16,
                background: tradeResult.accepted ? '#0d1a10' : '#1a0d0d',
                border: `1px solid ${tradeResult.accepted ? '#2a4a2a' : '#4a2a2a'}`,
                color: tradeResult.accepted ? '#4caf50' : '#ef5350',
                fontSize: 12,
              }}>
                {tradeResult.accepted
                  ? '✓ Trade accepted! The pick has been swapped.'
                  : `✗ Trade declined: ${tradeResult.reason}`}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowTradeModal(false)}
                style={{
                  padding: '7px 18px', fontSize: 12, cursor: 'pointer', borderRadius: 4,
                  background: 'transparent', border: '1px solid #333', color: '#888',
                }}
              >
                {tradeResult?.accepted ? 'Close' : 'Cancel'}
              </button>
              {!tradeResult?.accepted && (
                <button
                  onClick={handleProposeTrade}
                  disabled={!tradeMyPickAssetId || !tradeTheirPickAssetId || !tradeTheirTeamId || tradingPick}
                  style={{
                    padding: '7px 18px', fontSize: 12, borderRadius: 4,
                    cursor: tradeMyPickAssetId && tradeTheirPickAssetId && tradeTheirTeamId ? 'pointer' : 'not-allowed',
                    background: tradeMyPickAssetId && tradeTheirPickAssetId ? '#FF8740' : '#222',
                    border: 'none',
                    color: tradeMyPickAssetId && tradeTheirPickAssetId ? '#000' : '#444',
                    fontWeight: 600,
                  }}
                >
                  {tradingPick ? 'Proposing…' : 'Propose Trade'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
