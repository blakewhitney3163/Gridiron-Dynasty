import React, { useState } from 'react';
import { T } from '../theme';

const STORAGE_KEY = 's2s_tutorial_seen';

export function markTutorialSeen() {
  localStorage.setItem(STORAGE_KEY, '1');
}

export function hasTutorialBeenSeen(): boolean {
  return localStorage.getItem(STORAGE_KEY) === '1';
}

interface Step {
  icon: string;
  title: string;
  body: string;
  tag: string;
  tagColor: string;
}

const STEPS: Step[] = [
  {
    icon: '🏈',
    tag: 'WELCOME',
    tagColor: '#FF8740',
    title: 'Welcome to Your Dynasty',
    body: "You're the GM and head of operations for your franchise. Your job is to build a championship team through smart roster moves, coaching hires, and draft picks. This tour covers everything you need to know.",
  },
  {
    icon: '🏠',
    tag: 'HOME',
    tagColor: '#4FC3F7',
    title: 'The Home Screen',
    body: "The Home tab is your command center each week. Your upcoming game appears here — sim it to see the result. The sidebar on the right shows standings, your record, and the controls to advance the season.",
  },
  {
    icon: '▶',
    tag: 'SIMULATING',
    tagColor: '#4caf50',
    title: 'Playing Through the Season',
    body: "Hit Sim My Game to simulate your weekly matchup. After the result, click Advance Week to move to the next week. Repeat all 17 weeks, then the playoffs are simulated automatically.",
  },
  {
    icon: '🏆',
    tag: 'PLAYOFFS',
    tagColor: '#FFD700',
    title: 'Playoffs & Champions',
    body: "After Week 17, the top 7 teams from each conference make the playoffs. Simulate the bracket from the Home screen. Win the championship to add a title to your dynasty's history.",
  },
  {
    icon: '👥',
    tag: 'MY TEAM',
    tagColor: '#FF8740',
    title: 'Managing Your Roster',
    body: "The My Team tab is your roster hub. Your active roster holds 53 players. Cut underperformers, view player profiles with full stats and contract details, and keep an eye on injury reports.",
  },
  {
    icon: '🎓',
    tag: 'PRACTICE SQUAD',
    tagColor: '#4FC3F7',
    title: 'Practice Squad',
    body: "Keep up to 16 developmental players on your Practice Squad at a reduced salary. Young PS players develop faster than active roster players. Promote them when they're ready to contribute.",
  },
  {
    icon: '💰',
    tag: 'SALARY CAP',
    tagColor: '#e57373',
    title: 'Managing the Cap',
    body: "There's a hard salary cap every season. The Salaries tab shows your total cap hit, every player's contract, and a year-by-year schedule of future commitments. Going over the cap isn't allowed — plan ahead.",
  },
  {
    icon: '✍️',
    tag: 'FREE AGENTS',
    tagColor: '#4caf50',
    title: 'Free Agency',
    body: "Need depth or a starter? Sign free agents from the FA pool — they're available year-round. CPU teams are also signing players, so don't sleep on high-value free agents. Free agency opens after the playoffs.",
  },
  {
    icon: '🤝',
    tag: 'TRADES',
    tagColor: '#4FC3F7',
    title: 'Making Trades',
    body: "Trade players and draft picks with CPU teams from the Trades tab. CPU GMs will also send you incoming trade offers that appear on the Home screen. Your trade status (open/guarded/closed) affects how often you get offers.",
  },
  {
    icon: '🎯',
    tag: 'COACHING',
    tagColor: '#FF8740',
    title: 'Coaching Staff',
    body: "Your Head Coach, Offensive/Defensive Coordinators, and Special Teams coach all affect game outcomes through their ratings. Contracts last 1–4 years — expired slots show up in the pre-season staff review.",
  },
  {
    icon: '🔬',
    tag: 'SCOUTING',
    tagColor: '#4FC3F7',
    title: 'Your Scouting Staff',
    body: "Scouts generate weekly scouting points during the season. More scouting points = better intel on draft prospects, letting you reveal their true ratings before draft day. You can have up to 3 scouts.",
  },
  {
    icon: '📋',
    tag: 'DRAFT',
    tagColor: '#FF8740',
    title: 'The Annual Draft',
    body: "Each offseason you draft from a pool of college prospects. Use scouting points during the season to evaluate players on the Prospect Board. Undrafted prospects become free agents — don't miss hidden gems.",
  },
  {
    icon: '🏟',
    tag: 'PRE-SEASON',
    tagColor: '#4caf50',
    title: 'Pre-Season Staff Review',
    body: "Before each new season, you'll review your coaching and scouting staff. Hire replacements for expired contracts, pick contract lengths (1–4 years), then lock in your staff to generate the schedule and start the season.",
  },
  {
    icon: '✅',
    tag: 'READY',
    tagColor: '#4caf50',
    title: "You're Ready, Coach",
    body: "That covers everything. Build your roster, manage the cap, make smart trades, develop young talent, and bring home a championship. You can reopen this guide anytime with the ? button in the top bar. Good luck!",
  },
];

interface Props {
  onClose: () => void;
}

export default function TutorialModal({ onClose }: Props) {
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  const handleClose = () => {
    markTutorialSeen();
    onClose();
  };

  const handleNext = () => {
    if (isLast) {
      handleClose();
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'monospace',
      }}
    >
      <div style={{
        width: 480, background: T.bgPanel,
        border: `1px solid ${T.borderMid}`,
        borderRadius: 10, overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
      }}>

        {/* Progress bar */}
        <div style={{ height: 3, background: T.bgCard }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: current.tagColor,
            transition: 'width 0.3s ease, background 0.3s ease',
          }} />
        </div>

        {/* Body */}
        <div style={{ padding: '32px 36px 28px' }}>

          {/* Tag + step counter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 2,
              color: current.tagColor,
              border: `1px solid ${current.tagColor}`,
              padding: '2px 8px', borderRadius: 3,
              opacity: 0.9,
            }}>
              {current.tag}
            </span>
            <span style={{ fontSize: 9, color: T.textDim, letterSpacing: 1 }}>
              {step + 1} of {STEPS.length}
            </span>
          </div>

          {/* Icon */}
          <div style={{ fontSize: 52, textAlign: 'center', marginBottom: 18, lineHeight: 1 }}>
            {current.icon}
          </div>

          {/* Title */}
          <div style={{
            fontSize: 20, fontWeight: 800, color: T.textPrimary,
            textAlign: 'center', marginBottom: 14, lineHeight: 1.2,
            letterSpacing: 0.5,
          }}>
            {current.title}
          </div>

          {/* Body text */}
          <div style={{
            fontSize: 12, color: T.textSecondary, lineHeight: 1.7,
            textAlign: 'center', marginBottom: 28,
          }}>
            {current.body}
          </div>

          {/* Step dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 28 }}>
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                style={{
                  width: i === step ? 20 : 8, height: 8,
                  borderRadius: 4, border: 'none', cursor: 'pointer',
                  background: i === step ? current.tagColor : i < step ? T.borderStrong : T.borderFaint,
                  transition: 'all 0.2s ease',
                  padding: 0,
                }}
              />
            ))}
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={isFirst}
              style={{
                padding: '9px 18px', borderRadius: 5, fontSize: 11,
                background: 'none', border: `1px solid ${T.borderFaint}`,
                color: isFirst ? T.textDim : T.textMuted,
                cursor: isFirst ? 'not-allowed' : 'pointer',
                opacity: isFirst ? 0.4 : 1,
              }}
            >
              ← Back
            </button>

            <button
              onClick={handleClose}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 5, fontSize: 10,
                background: 'none', border: 'none',
                color: T.textDim, cursor: 'pointer',
                letterSpacing: 1,
              }}
            >
              Skip Tour
            </button>

            <button
              onClick={handleNext}
              style={{
                padding: '9px 22px', borderRadius: 5, fontSize: 11,
                fontWeight: 700, cursor: 'pointer',
                background: isLast ? current.tagColor === '#4caf50' ? '#0a2a0a' : '#1a1000' : T.bgCard,
                border: `1px solid ${current.tagColor}`,
                color: current.tagColor,
                letterSpacing: 0.5,
              }}
            >
              {isLast ? "Let's Go! →" : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
