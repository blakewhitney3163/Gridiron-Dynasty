import React, { useEffect, useState } from 'react';
import { T } from './theme';
import { Prospect, DraftTeam, PickSlot, MyPick, CpuPick } from './draft/types';
import { MAX_SCOUTS, draftGrade } from './draft/draftUtils';
import ProspectBoard from './draft/ProspectBoard';
import MyPicksSidebar from './draft/MyPicksSidebar';
import DraftSummary from './draft/DraftSummary';

declare const window: any;

interface Props {
  userTeam: { id: number; city: string; name: string };
  currentSeason: number;
  onDraftComplete: () => void;
}

export default function Draft({ userTeam, currentSeason, onDraftComplete }: Props) {
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
  const [scoutsUsed, setScoutsUsed] = useState(0);
  const [scouting, setScouting] = useState<number | null>(null);

  useEffect(() => { loadDraft(); }, []);

  const loadDraft = async () => {
    const [cls, order, sc] = await Promise.all([
      window.api.getDraftClass(),
      window.api.getDraftOrder(),
      window.api.getScoutCount(),
    ]);
    setProspects(cls); setDraftOrder(order); setScoutsUsed(sc);
    setDraftGenerated(cls.length > 0);

    const drafted = cls.filter((p: Prospect) => p.is_drafted);
    const roundsDone = Math.floor(drafted.length / 32);
    if (roundsDone >= 7) {
      setDraftFinished(true); setCurrentRound(7);
    } else {
      const round = roundsDone + 1;
      setCurrentRound(round);
      await loadRoundSlots(round);
    }
    const mine = cls.filter((p: Prospect) => p.is_drafted && p.drafted_by_team_id === userTeam.id);
    setMyPicks(mine.map((p: Prospect) => {
      const g = draftGrade(p.overall_rating);
      return { round: p.draft_round!, slot: (p.draft_pick! - 1) % 32 + 1, player: p, grade: g.grade, gradeColor: g.color };
    }));
  };

  const loadRoundSlots = async (round: number) => {
    const slots: PickSlot[] = await window.api.getRoundPickOrder({ round });
    setRoundPickSlots(slots);
    const uSlots = slots.filter(s => s.ownerTeamId === userTeam.id && !s.isUsed).map(s => s.slot);
    setUserPickSlots(uSlots);
    setCurrentPickIdx(0);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    await window.api.generateDraftClass();
    await loadDraft();
    setGenerating(false);
  };

  const handleScout = async (prospectId: number) => {
    if (scoutsUsed >= MAX_SCOUTS || scouting !== null) return;
    setScouting(prospectId);
    const res = await window.api.scoutProspect(prospectId);
    if (res.success) {
      setScoutsUsed(s => s + 1);
      setProspects(await window.api.getDraftClass());
    }
    setScouting(null);
  };

  const handlePick = async (prospect: Prospect) => {
    if (running) return;
    setRunning(true);
    const slot = userPickSlots[currentPickIdx] ?? 1;
    const overallPick = (currentRound - 1) * 32 + slot;
    await window.api.makeDraftPick({ prospectId: prospect.id, teamId: userTeam.id, round: currentRound, pick: overallPick });

    const g = draftGrade(prospect.overall_rating);
    setMyPicks(prev => [...prev, { round: currentRound, slot, player: prospect, grade: g.grade, gradeColor: g.color }]);

    if (currentPickIdx < userPickSlots.length - 1) {
      setProspects(await window.api.getDraftClass());
      setCurrentPickIdx(prev => prev + 1);
      setRunning(false);
      return;
    }

    const cpuResults: CpuPick[] = await window.api.runCpuRound({ round: currentRound, userTeamId: userTeam.id });
    setLastCpuPicks(cpuResults);
    setProspects(await window.api.getDraftClass());
    setShowResults(true);
    setRunning(false);
  };

  const handleAutoPick = () => {
    const best = prospects.find(p => !p.is_drafted && (posFilter === 'ALL' || p.position === posFilter));
    if (best) handlePick(best);
  };

  const handleNextRound = async () => {
    if (currentRound >= 7) { setDraftFinished(true); return; }
    const next = currentRound + 1;
    setCurrentRound(next);
    setShowResults(false);
    setLastCpuPicks([]);
    await loadRoundSlots(next);
  };

  const handleCompleteDraft = async () => {
    setRunning(true);
    await window.api.completeDraft();
    setRunning(false);
    onDraftComplete();
  };

  const scoutsLeft = MAX_SCOUTS - scoutsUsed;
  const available  = prospects.filter(p => !p.is_drafted && (posFilter === 'ALL' || p.position === posFilter));
  const pickNum    = userPickSlots[currentPickIdx];
  const totalPicksThisRound = userPickSlots.length;

  // Generate screen
  if (!draftGenerated) return (
    <div style={{ padding: '20px 24px', maxWidth: 500 }}>
      <h1 style={{ color: T.textPrimary, fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>{currentSeason} NFL Draft</h1>
      <p style={{ color: T.textMuted, fontSize: 13, margin: '0 0 20px' }}>
        Generate the rookie class before the draft begins — 280 prospects across all positions.
      </p>
      <button
        onClick={handleGenerate}
        disabled={generating}
        style={{
          padding: '10px 24px', fontWeight: 700, fontSize: 13, borderRadius: 5,
          background: generating ? T.bgPanel : T.bgGreen,
          border: `1px solid ${generating ? T.borderFaint : '#2a4a2a'}`,
          color: generating ? T.textDim : '#4caf50',
          cursor: generating ? 'not-allowed' : 'pointer',
        }}
      >
        {generating ? 'Generating...' : '▶ Generate Draft Class'}
      </button>
    </div>
  );

  // Post-draft summary
  if (draftFinished) return (
    <DraftSummary
      userTeam={userTeam}
      currentSeason={currentSeason}
      myPicks={myPicks}
      running={running}
      onComplete={handleCompleteDraft}
    />
  );

  // Active draft
  return (
    <div style={{ padding: '20px 24px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ color: T.textPrimary, fontSize: 20, fontWeight: 700, margin: 0 }}>{currentSeason} NFL Draft</h1>
          <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12 }}>
            <span style={{ color: T.textDim }}>Round {currentRound} of 7</span>
            <span style={{ color: T.textMuted }}>{available.length} prospects available</span>
            {totalPicksThisRound > 1 && !showResults && (
              <span style={{ color: '#FF8740' }}>
                You have {totalPicksThisRound} picks this round (Pick {currentPickIdx + 1} of {totalPicksThisRound})
              </span>
            )}
          </div>
        </div>
        <div style={{ background: T.bgCard, border: `1px solid ${T.borderFaint}`, borderRadius: 6, padding: '8px 14px', textAlign: 'center' }}>
          <div style={{ color: T.textDim, fontSize: 9, letterSpacing: 1 }}>SCOUTS</div>
          <div style={{ color: scoutsLeft > 5 ? '#4caf50' : scoutsLeft > 0 ? '#FF8740' : '#e57373', fontWeight: 700, fontSize: 16 }}>
            {scoutsLeft} / {MAX_SCOUTS}
          </div>
        </div>
      </div>

      {/* Two-panel layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>
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
          scoutsLeft={scoutsLeft}
          scouting={scouting}
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
    </div>
  );
}
