import React, { useState } from 'react';
import { T } from '../theme';

const STORAGE_KEY = 's2s_tutorial_seen';

export function markTutorialSeen() {
  localStorage.setItem(STORAGE_KEY, '1');
}

export function hasTutorialBeenSeen(): boolean {
  return localStorage.getItem(STORAGE_KEY) === '1';
}

export function hasTipBeenSeen(key: string): boolean {
  return localStorage.getItem(`s2s_tip_${key}`) === '1';
}

export function markTipSeen(key: string) {
  localStorage.setItem(`s2s_tip_${key}`, '1');
}

// ── Contextual tab tips ──────────────────────────────────────────────────────

const TAB_TIPS: Record<string, { icon: string; title: string; body: string; color: string }> = {
  home: {
    icon: '🏠', color: '#4FC3F7',
    title: 'Home Tab',
    body: "This is your command center. Simulate your weekly game, check the injury report, monitor team chemistry, and advance the season from here.",
  },
  myteam: {
    icon: '👥', color: '#FF8740',
    title: 'My Team',
    body: "Manage your 53-man roster and 16-man practice squad. View player profiles, handle contracts, place injured players on IR, and promote PS players when ready.",
  },
  trades: {
    icon: '🤝', color: '#4FC3F7',
    title: 'Trades',
    body: "Propose deals with any of the 32 CPU teams. Set your trade status to Buyer or Seller to shape how often offers come in. CPU teams will also send you deals on the Home tab.",
  },
  draft: {
    icon: '📋', color: '#FF8740',
    title: 'The Draft',
    body: "280 prospects are generated each offseason. Use scouting points earned during the season to reveal their true ratings on the Prospect Board before draft day.",
  },
  league: {
    icon: '📊', color: '#4FC3F7',
    title: 'League',
    body: "Check standings, browse team rosters, view the full schedule, track leaderboards, and follow the playoff bracket — all here.",
  },
  news: {
    icon: '📰', color: '#4caf50',
    title: 'News Center',
    body: "Every contract signing, trade, injury, milestone, and award gets logged here. Filter by category or season to track your dynasty's history.",
  },
};

interface ContextualTipProps {
  tipKey: string;
}

export function ContextualTip({ tipKey }: ContextualTipProps) {
  const tip = TAB_TIPS[tipKey];
  const [visible, setVisible] = useState(() => !!tip && !hasTipBeenSeen(tipKey));

  if (!tip || !visible) return null;

  const dismiss = () => {
    markTipSeen(tipKey);
    setVisible(false);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      margin: '12px 16px 0',
      padding: '12px 16px',
      background: '#0a1a2a',
      border: `1px solid ${tip.color}44`,
      borderLeft: `3px solid ${tip.color}`,
      borderRadius: 6,
      fontFamily: 'monospace',
    }}>
      <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.3 }}>{tip.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: tip.color, letterSpacing: 1, marginBottom: 3 }}>
          {tip.title.toUpperCase()}
        </div>
        <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.6 }}>
          {tip.body}
        </div>
      </div>
      <button
        onClick={dismiss}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: T.textDim, fontSize: 14, lineHeight: 1,
          flexShrink: 0, padding: '0 2px',
        }}
        title="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

// ── Welcome modal ────────────────────────────────────────────────────────────

interface WelcomeStep {
  icon: string;
  tag: string;
  tagColor: string;
  title: string;
  body: string;
}

const WELCOME_STEPS: WelcomeStep[] = [
  {
    icon: '🏈',
    tag: 'WELCOME',
    tagColor: '#FF8740',
    title: 'Welcome to Your Dynasty',
    body: "You're the GM and head of operations. Build a championship roster through smart trades, coaching hires, free agency, and the annual draft. Every decision is yours.",
  },
  {
    icon: '💡',
    tag: 'TIPS',
    tagColor: '#4FC3F7',
    title: 'Tips Along the Way',
    body: "As you explore each section for the first time, a short tip will appear at the top of the screen to guide you. Dismiss it when you're ready. Reopen this guide anytime with the ? button.",
  },
  {
    icon: '✅',
    tag: 'READY',
    tagColor: '#4caf50',
    title: "You're Set, Coach",
    body: "Start by reviewing your pre-season staff on the Home tab, then generate your schedule to kick off the season. Good luck — bring home a championship.",
  },
];

interface Props {
  onClose: () => void;
}

export default function TutorialModal({ onClose }: Props) {
  const [step, setStep] = useState(0);

  const current = WELCOME_STEPS[step];
  const isFirst = step === 0;
  const isLast  = step === WELCOME_STEPS.length - 1;
  const progress = ((step + 1) / WELCOME_STEPS.length) * 100;

  const handleClose = () => {
    markTutorialSeen();
    onClose();
  };

  const handleNext = () => {
    if (isLast) handleClose();
    else setStep(s => s + 1);
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
        width: 460, background: T.bgPanel,
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

        <div style={{ padding: '32px 36px 28px' }}>

          {/* Tag + counter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 2,
              color: current.tagColor,
              border: `1px solid ${current.tagColor}`,
              padding: '2px 8px', borderRadius: 3,
            }}>
              {current.tag}
            </span>
            <span style={{ fontSize: 9, color: T.textDim, letterSpacing: 1 }}>
              {step + 1} of {WELCOME_STEPS.length}
            </span>
          </div>

          {/* Icon */}
          <div style={{ fontSize: 52, textAlign: 'center', marginBottom: 18, lineHeight: 1 }}>
            {current.icon}
          </div>

          {/* Title */}
          <div style={{
            fontSize: 20, fontWeight: 800, color: T.textPrimary,
            textAlign: 'center', marginBottom: 14, lineHeight: 1.2, letterSpacing: 0.5,
          }}>
            {current.title}
          </div>

          {/* Body */}
          <div style={{
            fontSize: 12, color: T.textSecondary, lineHeight: 1.7,
            textAlign: 'center', marginBottom: 28,
          }}>
            {current.body}
          </div>

          {/* Step dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 28 }}>
            {WELCOME_STEPS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)} style={{
                width: i === step ? 20 : 8, height: 8,
                borderRadius: 4, border: 'none', cursor: 'pointer',
                background: i === step ? current.tagColor : i < step ? T.borderStrong : T.borderFaint,
                transition: 'all 0.2s ease', padding: 0,
              }} />
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

            <button onClick={handleClose} style={{
              flex: 1, padding: '9px 0', borderRadius: 5, fontSize: 10,
              background: 'none', border: 'none', color: T.textDim, cursor: 'pointer', letterSpacing: 1,
            }}>
              Skip
            </button>

            <button onClick={handleNext} style={{
              padding: '9px 22px', borderRadius: 5, fontSize: 11,
              fontWeight: 700, cursor: 'pointer',
              background: T.bgCard,
              border: `1px solid ${current.tagColor}`,
              color: current.tagColor, letterSpacing: 0.5,
            }}>
              {isLast ? "Let's Go! →" : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
