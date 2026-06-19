import React from 'react';
import { CpuOffer } from '../trades/types';
import { pickLabel, ratingColor, STATUS_META } from '../trades/tradeUtils';

interface Props {
  offer: CpuOffer;
  currentSeason: number;
  working: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onViewDetails: () => void;
}

export default function TradeOfferCard({
  offer, currentSeason, working, onAccept, onDecline, onViewDetails,
}: Props) {
  const valueDiff = offer.offerValue - offer.requestedValue;
  const valueColor = valueDiff >= 0 ? '#4caf50' : '#FF8740';

  return (
    <div style={{
      background: '#0c110c', border: '1px solid #1e3a1e', borderRadius: 6,
      padding: '12px 16px', marginBottom: 16,
    }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 9, color: '#4caf50', letterSpacing: 2, fontWeight: 'bold' }}>
          📨 INCOMING TRADE OFFER
        </span>
        <span style={{ fontSize: 11, color: '#4caf50' }}>— {offer.fromTeamName}</span>
        <button onClick={onViewDetails} style={{
          marginLeft: 'auto', padding: '2px 10px', fontSize: 10, cursor: 'pointer',
          background: 'transparent', border: '1px solid #1a2a3a', borderRadius: 3, color: '#4FC3F7',
        }}>
          Full Details →
        </button>
      </div>

      {/* Trade terms */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>

        {/* They want */}
        <div style={{ background: '#120808', border: '1px solid #2a1a1a', borderRadius: 4, padding: '8px 12px', minWidth: 160 }}>
          <div style={{ fontSize: 9, color: '#555', letterSpacing: 1, marginBottom: 4 }}>THEY WANT</div>
          <div style={{ fontSize: 13, color: '#e57373', fontWeight: 'bold' }}>
            {offer.requestedPlayer.first_name} {offer.requestedPlayer.last_name}
          </div>
          <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>
            {offer.requestedPlayer.position} ·{' '}
            <span style={{ color: ratingColor(offer.requestedPlayer.overall_rating) }}>
              {offer.requestedPlayer.overall_rating} OVR
            </span>
            {' · '}Value: {offer.requestedValue}
          </div>
        </div>

        <span style={{ fontSize: 18, color: '#2a2a2a' }}>⇄</span>

        {/* You receive */}
        <div style={{ background: '#081208', border: '1px solid #1a2a1a', borderRadius: 4, padding: '8px 12px', minWidth: 160 }}>
          <div style={{ fontSize: 9, color: '#555', letterSpacing: 1, marginBottom: 4 }}>YOU RECEIVE</div>
          <div style={{ fontSize: 13, color: '#4caf50', fontWeight: 'bold' }}>
            {offer.offeredPlayer.first_name} {offer.offeredPlayer.last_name}
          </div>
          <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>
            {offer.offeredPlayer.position} ·{' '}
            <span style={{ color: ratingColor(offer.offeredPlayer.overall_rating) }}>
              {offer.offeredPlayer.overall_rating} OVR
            </span>
          </div>
          {offer.offeredPick && (
            <div style={{ fontSize: 10, color: '#4FC3F7', marginTop: 2 }}>
              + 📋 {pickLabel(offer.offeredPick, currentSeason)}
            </div>
          )}
          <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>Total Value: {offer.offerValue}</div>
        </div>

        {/* Value diff */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: '#444', letterSpacing: 1, marginBottom: 4 }}>NET VALUE</div>
          <div style={{ fontSize: 15, fontWeight: 'bold', color: valueColor }}>
            {valueDiff >= 0 ? '+' : ''}{valueDiff}
          </div>
          <div style={{ fontSize: 9, color: '#444' }}>{valueDiff >= 0 ? 'in your favor' : 'in their favor'}</div>
        </div>

        {/* Actions */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={onDecline} disabled={working} style={{
            padding: '7px 16px', fontSize: 11, cursor: 'pointer', borderRadius: 4,
            background: 'transparent', border: '1px solid #2a2a2a', color: '#555',
          }}>
            Decline
          </button>
          <button onClick={onAccept} disabled={working} style={{
            padding: '7px 18px', fontSize: 12, fontWeight: 'bold', cursor: working ? 'not-allowed' : 'pointer',
            borderRadius: 4, border: 'none',
            background: working ? '#1a3a1a' : '#4caf50',
            color: working ? '#4caf50' : '#000',
          }}>
            {working ? 'Processing...' : 'Accept Trade'}
          </button>
        </div>
      </div>
    </div>
  );
}
