import React from 'react';
import { T } from '../theme';
import { CpuOffer } from './types';
import { pickLabel, ratingColor } from './tradeUtils';

interface Props {
  cpuOffer: CpuOffer;
  offerWorking: boolean;
  currentSeason: number;
  offerIndex: number;
  offerCount: number;
  onAccept: () => void;
  onDecline: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const traitColor = (t: string) =>
  t === 'X-Factor' ? '#FFD700' : t === 'Superstar' ? '#a78bfa' : t === 'Star' ? '#94a3b8' : T.textDim;

const fmtSal = (s?: number) => s ? `$${s.toFixed(1)}M` : '';

export default function CpuOfferBanner({ cpuOffer, offerWorking, currentSeason, offerIndex, offerCount, onAccept, onDecline, onPrev, onNext }: Props) {
  const posLabel = (p: typeof cpuOffer.requestedPlayer) => p.position_label || p.position;

  return (
    <div style={{
      background: T.bgPanel, border: `1px solid ${T.borderMid}`, borderRadius: 8,
      padding: '14px 16px', marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ color: '#4caf50', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
          📨 INCOMING TRADE OFFER — {cpuOffer.fromTeamName}
        </div>
        {offerCount > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <span style={{
              background: '#1a2a1a', border: '1px solid #2a4a2a', borderRadius: 10,
              color: '#4caf50', fontSize: 10, fontWeight: 700, padding: '2px 8px',
            }}>
              {offerIndex + 1} of {offerCount} offers
            </span>
            <button
              onClick={onPrev}
              disabled={offerIndex === 0}
              style={{
                width: 24, height: 24, borderRadius: 4, border: '1px solid #2a2a2a',
                background: offerIndex === 0 ? '#111' : '#1a1a1a',
                color: offerIndex === 0 ? '#333' : '#aaa',
                fontSize: 12, cursor: offerIndex === 0 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >‹</button>
            <button
              onClick={onNext}
              disabled={offerIndex === offerCount - 1}
              style={{
                width: 24, height: 24, borderRadius: 4, border: '1px solid #2a2a2a',
                background: offerIndex === offerCount - 1 ? '#111' : '#1a1a1a',
                color: offerIndex === offerCount - 1 ? '#333' : '#aaa',
                fontSize: 12, cursor: offerIndex === offerCount - 1 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >›</button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>

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

        <div style={{ textAlign: 'center', paddingTop: 14 }}>
          <div style={{ fontSize: 9, color: T.textDim
