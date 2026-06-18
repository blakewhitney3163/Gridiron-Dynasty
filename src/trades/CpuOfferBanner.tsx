import React from 'react';
import { T } from '../theme';
import { CpuOffer } from './types';
import { pickLabel } from './tradeUtils';

interface Props {
  cpuOffer: CpuOffer;
  offerWorking: boolean;
  currentSeason: number;
  onAccept: () => void;
  onDecline: () => void;
}

export default function CpuOfferBanner({ cpuOffer, offerWorking, currentSeason, onAccept, onDecline }: Props) {
  return (
    <div style={{
      background: '#0a1a0a', border: '1px solid #2a4a2a', borderRadius: 8,
      padding: '14px 16px', marginBottom: 20,
    }}>
      <div style={{ color: '#4caf50', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>
        📨 INCOMING TRADE OFFER — {cpuOffer.fromTeamName}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, background: T.bgCard, borderRadius: 6, padding: '10px 12px' }}>
          <div style={{ color: T.textDim, fontSize: 9, letterSpacing: 1, marginBottom: 6 }}>THEY WANT</div>
          <div style={{ color: '#e57373', fontWeight: 700, fontSize: 13 }}>
            {cpuOffer.requestedPlayer.first_name} {cpuOffer.requestedPlayer.last_name}
          </div>
          <div style={{ color: T.textMuted, fontSize: 11 }}>
            {cpuOffer.requestedPlayer.position} · {cpuOffer.requestedPlayer.overall_rating} OVR · Value: {cpuOffer.requestedValue}
          </div>
        </div>

        <div style={{ color: T.textDim, fontSize: 18 }}>⇄</div>

        <div style={{ flex: 1, background: T.bgCard, borderRadius: 6, padding: '10px 12px' }}>
          <div style={{ color: T.textDim, fontSize: 9, letterSpacing: 1, marginBottom: 6 }}>YOU RECEIVE</div>
          <div style={{ color: '#4caf50', fontWeight: 700, fontSize: 13 }}>
            {cpuOffer.offeredPlayer.first_name} {cpuOffer.offeredPlayer.last_name}
          </div>
          <div style={{ color: T.textMuted, fontSize: 11 }}>
            {cpuOffer.offeredPlayer.position} · {cpuOffer.offeredPlayer.overall_rating} OVR
          </div>
          {cpuOffer.offeredPick && (
            <div style={{ color: '#4FC3F7', fontSize: 11, marginTop: 4 }}>
              + 📋 {pickLabel(cpuOffer.offeredPick, currentSeason)}
            </div>
          )}
          <div style={{ color: T.textDim, fontSize: 10, marginTop: 4 }}>Total Value: {cpuOffer.offerValue}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          onClick={onAccept}
          disabled={offerWorking}
          style={{
            padding: '6px 16px', background: offerWorking ? T.bgCard : T.bgGreen,
            border: '1px solid #2a4a2a', borderRadius: 4,
            color: offerWorking ? T.textMuted : '#4caf50', fontSize: 12, cursor: offerWorking ? 'not-allowed' : 'pointer',
          }}
        >
          {offerWorking ? 'Processing...' : 'Accept'}
        </button>
        <button
          onClick={onDecline}
          style={{
            padding: '6px 16px', background: T.bgCard, color: T.textMuted,
            border: `1px solid ${T.borderFaint}`, borderRadius: 4, fontSize: 12, cursor: 'pointer',
          }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
