import React from 'react';
import { T } from '../theme';
import { CpuOffer } from './types';
import { pickLabel, ratingColor } from './tradeUtils';

interface Props {
  cpuOffer: CpuOffer;
  offerWorking: boolean;
  currentSeason: number;
  onAccept: () => void;
  onDecline: () => void;
}

const traitColor = (t: string) =>
  t === 'X-Factor' ? '#FFD700' : t === 'Superstar' ? '#a78bfa' : t === 'Star' ? '#94a3b8' : T.textDim;

const fmtSal = (s?: number) => s ? `$${s.toFixed(1)}M` : '';

export default function CpuOfferBanner({ cpuOffer, offerWorking, currentSeason, onAccept, onDecline }: Props) {
  const posLabel = (p: typeof cpuOffer.requestedPlayer) => p.position_label || p.position;

  return (
    <div style={{
      background: T.bgPanel, border: `1px solid ${T.borderMid}`, borderRadius: 8,
      padding: '14px 16px', marginBottom: 20,
    }}>
      <div style={{ color: '#4caf50', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>
        📨 INCOMING TRADE OFFER — {cpuOffer.fromTeamName}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>

        {/* They want */}
        <div style={{ flex: 1, background: T.bgCard, border: `1px solid ${T.borderMid}`, borderRadius: 6, padding: '10px 12px', minWidth: 200 }}>
          <div style={{ color: T.textDim, fontSize: 9, letterSpacing: 1, marginBottom: 6 }}>THEY WANT</div>
          <div style={{ color: '#e57373', fontWeight: 700, fontSize: 14 }}>
            {cpuOffer.requestedPlayer.first_name} {cpuOffer.requestedPlayer.last_name}
          </div>
          <div style={{ color: T.textMuted, fontSize: 11, marginTop: 3 }}>
            {posLabel(cpuOffer.requestedPlayer)} ·{' '}
            <span style={{ color: ratingColor(cpuOffer.requestedPlayer.overall_rating) }}>
              {cpuOffer.requestedPlayer.overall_rating} OVR
            </span>
            {' · '}Age {cpuOffer.requestedPlayer.age}
            {cpuOffer.requestedPlayer.salary ? ` · ${fmtSal(cpuOffer.requestedPlayer.salary)}` : ''}
          </div>
          <div style={{ fontSize: 11, marginTop: 3 }}>
            <span style={{ color: traitColor(cpuOffer.requestedPlayer.dev_trait) }}>
              {cpuOffer.requestedPlayer.dev_trait}
            </span>
            <span style={{ color: T.textDim }}> · Trade Value: {cpuOffer.requestedValue}</span>
          </div>
        </div>

        <div style={{ color: T.textDim, fontSize: 18, paddingTop: 14 }}>⇄</div>

        {/* You receive */}
        <div style={{ flex: 1, background: T.bgCard, border: `1px solid ${T.borderMid}`, borderRadius: 6, padding: '10px 12px', minWidth: 200 }}>
          <div style={{ color: T.textDim, fontSize: 9, letterSpacing: 1, marginBottom: 6 }}>YOU RECEIVE</div>
          <div style={{ color: '#4caf50', fontWeight: 700, fontSize: 14 }}>
            {cpuOffer.offeredPlayer.first_name} {cpuOffer.offeredPlayer.last_name}
          </div>
          <div style={{ color: T.textMuted, fontSize: 11, marginTop: 3 }}>
            {posLabel(cpuOffer.offeredPlayer)} ·{' '}
            <span style={{ color: ratingColor(cpuOffer.offeredPlayer.overall_rating) }}>
              {cpuOffer.offeredPlayer.overall_rating} OVR
            </span>
            {' · '}Age {cpuOffer.offeredPlayer.age}
            {cpuOffer.offeredPlayer.salary ? ` · ${fmtSal(cpuOffer.offeredPlayer.salary)}` : ''}
          </div>
          <div style={{ fontSize: 11, marginTop: 3 }}>
            <span style={{ color: traitColor(cpuOffer.offeredPlayer.dev_trait) }}>
              {cpuOffer.offeredPlayer.dev_trait}
            </span>
            <span style={{ color: T.textDim }}> · Trade Value: {cpuOffer.offerValue}</span>
          </div>
          {cpuOffer.offeredPick && (
            <div style={{ color: '#4FC3F7', fontSize: 11, marginTop: 6 }}>
              + 📋 {pickLabel(cpuOffer.offeredPick, currentSeason)}
            </div>
          )}
        </div>

        {/* Net value */}
        <div style={{ textAlign: 'center', paddingTop: 14 }}>
          <div style={{ fontSize: 9, color: T.textDim, letterSpacing: 1, marginBottom: 4 }}>NET VALUE</div>
          {(() => {
            const diff = cpuOffer.offerValue - cpuOffer.requestedValue;
            const col = diff >= 0 ? '#4caf50' : '#FF8740';
            return (
              <>
                <div style={{ fontSize: 18, fontWeight: 700, color: col }}>{diff >= 0 ? '+' : ''}{diff}</div>
                <div style={{ fontSize: 9, color: T.textDim }}>{diff >= 0 ? 'in your favor' : 'in their favor'}</div>
              </>
            );
          })()}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button
          onClick={onAccept}
          disabled={offerWorking}
          style={{
            padding: '7px 20px', background: offerWorking ? T.bgCard : '#0a2a0a',
            border: '1px solid #2a5a2a', borderRadius: 4,
            color: offerWorking ? T.textMuted : '#4caf50',
            fontSize: 12, fontWeight: 700, cursor: offerWorking ? 'not-allowed' : 'pointer',
          }}
        >
          {offerWorking ? 'Processing...' : 'Accept Trade'}
        </button>
        <button
          onClick={onDecline}
          style={{
            padding: '7px 16px', background: T.bgCard, color: T.textMuted,
            border: `1px solid ${T.borderFaint}`, borderRadius: 4, fontSize: 12, cursor: 'pointer',
          }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
