import React, { useState, useEffect } from 'react';
import Home from './Home';
import Standings from './Standings';
import Teams from './Teams';
import Schedule from './Schedule';
import Stats from './Stats';
import Playoffs from './Playoffs';
import TeamSelection from './TeamSelection';
import Trades from './Trades';
import Franchise from './Franchise';
import Draft from './Draft';
import DepthChart from './DepthChart';
import Records from './Records';
import NewsFeed from './newsCenter/NewsFeed';
import { T } from './theme';
import { useGameStore, UserTeam } from './store/gameStore';

declare const window: any;

type Tab = 'home' | 'standings' | 'teams' | 'schedule' | 'stats' | 'playoffs' | 'trades' | 'franchise' | 'draft' | 'depth' | 'records' | 'news';
type Screen = 'loading' | 'start' | 'team-select' | 'setup' | 'game';

interface SetupStep { label: string; done: boolean; }

const BASE_TABS: { id: Tab; label: string }[] = [
  { id: 'home',       label: 'Home' },
  { id: 'standings',  label: 'Standings' },
  { id: 'teams',      label: 'Teams' },
  { id: 'schedule',   label: 'Schedule' },
  { id: 'stats',      label: 'Stats' },
  { id: 'records',    label: 'Records' },
  { id: 'playoffs',   label: 'Playoffs' },
  { id: 'trades',     label: 'Trades' },
  { id: 'franchise',  label: 'Franchise' },
  { id: 'depth',      label: 'Depth Chart' },
  { id: 'news',       label: '📰 News' },
];

export default function App() {
  const [screen, setScreen]           = useState<Screen>('loading');
  const [activeTab, setActiveTab]     = useState<Tab>('home');
  const [playoffData, setPlayoffData] = useState<any | null>(null);
  const [setupSteps, setSetupSteps]   = useState<SetupStep[]>([]);
  const [setupComplete, setSetupComplete] = useState(false);
  const [hasSave, setHasSave]         = useState(false);

  const {
    currentSeason, setCurrentSeason,
    userTeam, setUserTeam,
    playoffsComplete, setPlayoffsComplete,
    difficulty, setDifficulty,
    advanceSeason,
  } = useGameStore();

  useEffect(() => {
    window.api.getDifficulty().then((d: string) => setDifficulty(d as any));
    Promise.all([
      window.api.getCurrentSeason(),
      window.api.getUserTeam(),
      window.api.getOffseasonStatus(),
    ]).then(([season, team, offseason]: [number, UserTeam | null, any]) => {
      setCurrentSeason(season);
      setPlayoffsComplete(offseason.playoffsComplete ?? false);
      if (!team) {
        setHasSave(false);
        setScreen('start');
      } else {
        setHasSave(true);
        window.api.checkSetupDone().then((done: boolean) => {
          setUserTeam(team);
          setScreen(done ? 'start' : 'setup');
          if (!done) runSetup();
        });
      }
    });
  }, []);

  const markStep = (label: string, done: boolean) => {
    setSetupSteps(prev => {
      const existing = prev.find(s => s.label === label);
      if (existing) return prev.map(s => s.label === label ? { ...s, done } : s);
      return [...prev, { label, done }];
    });
  };

  const runSetup = async () => {
    markStep('Importing real NFL contracts from OTC...', false);
    await window.api.importOtcContracts();
    markStep('Importing real NFL contracts from OTC...', true);

    markStep('Building player career histories...', false);
    await window.api.importNflverseStats();
    markStep('Building player career histories...', true);

    markStep('Finalizing dynasty setup...', false);
    await window.api.balanceRosters();
    await new Promise(r => setTimeout(r, 600));
    markStep('Finalizing dynasty setup...', true);

    setSetupComplete(true);
    setTimeout(() => setScreen('game'), 1200);
  };

  const handleDifficultyChange = async (level: 'easy' | 'normal' | 'hard') => {
    setDifficulty(level);
    await window.api.setDifficulty(level);
  };

  const handleTeamSelect = async (team: UserTeam) => {
    setUserTeam(team);
    setScreen('setup');
    setSetupSteps([]);
    setSetupComplete(false);
    await window.api.resetSave();
    await window.api.setUserTeam(team.id);
    runSetup();
  };

  function handleSeasonAdvance(nextSeason: number) {
    advanceSeason(nextSeason);
    setPlayoffData(null);
    setActiveTab('home');
  }

  const tabs = playoffsComplete
    ? [...BASE_TABS.filter(t => t.id !== 'news'), { id: 'draft' as Tab, label: '⚡ Draft' }, { id: 'news' as Tab, label: '📰 News' }]
    : BASE_TABS;

  // ── Start Screen ──────────────────────────────────────────────────────────
  if (screen === 'start') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: T.bgPage, fontFamily: 'monospace', gap: 40,
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: T.textDim, fontSize: 10, letterSpacing: 3, margin: '0 0 8px' }}>PRESENTED BY</p>
          <h1 style={{ color: '#4FC3F7', fontSize: 48, fontWeight: 900, margin: 0, letterSpacing: 4 }}>NFL</h1>
          <h1 style={{ color: T.textPrimary, fontSize: 32, fontWeight: 700, margin: '4px 0', letterSpacing: 6 }}>SIMULATOR</h1>
          <p style={{ color: T.textMuted, fontSize: 11, letterSpacing: 4, margin: 0 }}>DYNASTY MODE</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => setScreen('team-select')}
            style={{
              padding: '16px 24px', fontSize: 13, fontWeight: 'bold', letterSpacing: 3,
              background: '#4caf50', color: '#000', border: 'none', borderRadius: 4,
              cursor: 'pointer', fontFamily: 'monospace',
            }}
          >
            NEW DYNASTY
          </button>
          <button
            onClick={() => { if (hasSave) setScreen('game'); }}
            style={{
              padding: '16px 24px', fontSize: 13, fontWeight: 'bold', letterSpacing: 3,
              background: 'transparent',
              color: hasSave ? T.textMuted : T.borderFaint,
              border: `1px solid ${hasSave ? T.borderStrong : T.bgCard}`,
              borderRadius: 4, cursor: hasSave ? 'pointer' : 'default',
              fontFamily: 'monospace',
            }}
          >
            {hasSave ? 'CONTINUE' : 'NO SAVED DYNASTY'}
          </button>
        </div>
      </div>
    );
  }

  // ── Team Selection ────────────────────────────────────────────────────────
  if (screen === 'team-select') {
    return <TeamSelection onSelect={handleTeamSelect} />;
  }

  // ── Setup Screen ──────────────────────────────────────────────────────────
  if (screen === 'setup') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: T.bgPage, fontFamily: 'monospace', gap: 32,
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#4FC3F7', fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: 4 }}>NFL SIMULATOR</h2>
          {userTeam && (
            <p style={{ color: T.textMuted, fontSize: 13, margin: '6px 0 0', letterSpacing: 2 }}>
              {userTeam.city} {userTeam.name}
            </p>
          )}
        </div>
        <div style={{ minWidth: 340 }}>
          <h3 style={{ color: T.textDim, fontSize: 10, letterSpacing: 2, margin: '0 0 16px', textAlign: 'center' }}>
            SETTING UP YOUR DYNASTY
          </h3>
          {setupSteps.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.borderFaint}` }}>
              <span style={{ color: step.done ? '#4caf50' : T.textDim, fontSize: 13, width: 16 }}>
                {step.done ? '✓' : '…'}
              </span>
              <span style={{ color: step.done ? T.textPrimary : T.textMuted, fontSize: 12 }}>{step.label}</span>
            </div>
          ))}
        </div>
        {setupComplete
          ? <p style={{ color: '#4caf50', fontSize: 11, letterSpacing: 2 }}>DYNASTY READY — LOADING...</p>
          : <p style={{ color: T.textDim, fontSize: 11, letterSpacing: 2 }}>PLEASE WAIT</p>}
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (screen === 'loading' || !userTeam) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: T.bgPage, color: T.textDim, fontFamily: 'monospace', fontSize: 13,
      }}>
        LOADING...
      </div>
    );
  }

  // ── Main Game ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: T.bgPage, fontFamily: 'monospace', color: T.textPrimary }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 20px', borderBottom: `1px solid ${T.borderFaint}`, background: T.bgPanel, flexShrink: 0 }}>
        <span style={{ color: '#4FC3F7', fontWeight: 700, fontSize: 13, letterSpacing: 2 }}>NFL</span>
        <span style={{ color: T.borderFaint }}>|</span>
        <span style={{ color: T.textPrimary, fontSize: 13 }}>{userTeam.city} {userTeam.name}</span>
        <button
          onClick={async () => {
            if (window.confirm('Start a new dynasty? This will wipe all current progress.')) {
              await window.api.resetSave();
              setUserTeam(null);
              setHasSave(false);
              setSetupSteps([]);
              setSetupComplete(false);
              setScreen('start');
            }
          }}
          style={{ fontSize: 10, color: T.borderStrong, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          new dynasty
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 9, color: T.textDim, letterSpacing: 1 }}>DIFFICULTY</span>
          {(['easy', 'normal', 'hard'] as const).map(d => (
            <button key={d} onClick={() => handleDifficultyChange(d)} style={{
              padding: '3px 8px', fontSize: 9, fontFamily: 'monospace',
              background: difficulty === d ? (d === 'easy' ? '#1a3a1a' : d === 'hard' ? '#3a1a1a' : '#1a1a2a') : 'none',
              color: difficulty === d ? (d === 'easy' ? '#4caf50' : d === 'hard' ? '#e57373' : '#4FC3F7') : T.textDim,
              border: `1px solid ${difficulty === d ? (d === 'easy' ? '#4caf50' : d === 'hard' ? '#e57373' : '#4FC3F7') : T.borderFaint}`,
              borderRadius: 3, cursor: 'pointer', textTransform: 'uppercase',
            }}>
              {d}
            </button>
          ))}
          <span style={{ color: T.textMuted, fontSize: 13, marginLeft: 4 }}>{currentSeason}</span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.borderFaint}`, background: T.bgPanel, flexShrink: 0, overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '11px 22px', background: 'none', border: 'none', cursor: 'pointer',
            color: activeTab === tab.id ? '#4FC3F7' : tab.id === 'draft' ? '#FF8740' : T.textMuted,
            borderBottom: activeTab === tab.id ? '2px solid #4FC3F7' : '2px solid transparent',
            fontWeight: activeTab === tab.id ? 'bold' : 'normal',
            fontSize: 13, whiteSpace: 'nowrap', fontFamily: 'monospace',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'home' && (
          <Home
            onNavigate={tab => setActiveTab(tab as Tab)}
            onSeasonAdvance={handleSeasonAdvance}
          />
        )}
        {activeTab === 'standings'  && <Standings />}
        {activeTab === 'teams'      && <Teams />}
        {activeTab === 'schedule'   && <Schedule />}
        {activeTab === 'stats'      && <Stats />}
        {activeTab === 'records'    && <Records />}
        {activeTab === 'playoffs'   && <Playoffs data={playoffData} setData={setPlayoffData} />}
        {activeTab === 'trades'     && <Trades />}
        {activeTab === 'franchise'  && <Franchise />}
        {activeTab === 'depth'      && <DepthChart />}
        {activeTab === 'news'       && <NewsFeed />}
        {activeTab === 'draft'      && <Draft onDraftComplete={() => setActiveTab('home')} />}
      </div>

    </div>
  );
}
