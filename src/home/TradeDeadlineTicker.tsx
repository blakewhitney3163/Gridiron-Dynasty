import React, { useEffect, useState } from 'react';
import { T } from '../theme';

declare const window: any;

interface Props {
  currentWeek: number;
  currentSeason: number;
  refreshKey?: number;
}

interface TradeItem {
  id: number;
  headline: string;
  week: number;
}

const DEADLINE_WEEK = 10;

export default function TradeDeadlineTicker({ currentWeek, currentSeason, refreshKey }: Props) {
  const [trades, setTrades] = useState<TradeItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const news = await window.api.getNewsFeed({ season: currentSeason, category: 'transactions', limit: 40 });
      if (cancelled) return;
      const filtered = (news ?? []).filter((n: any) => n.event_type === 'trade');
      setTrades(filtered);
    })();
    return () => { cancelled = true; };
  }, [currentSeason, refreshKey]);

  const weeksLeft = DEADLINE_WEEK - currentWeek;
  const urgencyColor =
    weeksLeft === 0 ? '#e57373' :
    weeksLeft <= 2 ? '#FF8740' :
    '#FFD700';

  const deadlineLabel =
    weeksLeft === 0 ? 'DEADLINE NOW' :
    weeksLeft === 1 ? '1 WK LEFT' :
    `${weeksLeft} WKS LEFT`;

  const tickerItems = trades.length > 0
    ? trades.map(t => `🤝 ${t.headline}`).join('     ·     ')
    : '📡 No trades reported yet — deadline approaching';

  const repeatText = trades.length > 0 ? `${tickerItems}     ·     ${tickerItems}` : tickerItems;

  return (
    <div style={{
      background: '#0e0c00',
      border: `1px solid ${urgencyColor}35`,
      borderRadius: 8,
      padding: '8px 0 8px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      overflow: 'hidden',
    }}>
      {/* Left badge */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        paddingRight: 14,
        borderRight: `1px solid ${urgencyColor}30`,
        minWidth: 88,
      }}>
        <div style={{
          fontSize: 7,
          fontWeight: 900,
          letterSpacing: 1.5,
          color: urgencyColor,
          textTransform: 'uppercase',
          background: `${urgencyColor}12`,
          border: `1px solid ${urgencyColor}35`,
          borderRadius: 3,
          padding: '2px 6px',
        }}>
          📡 TRADE WIRE
        </div>
        <div style={{
          fontSize: 9,
          color: urgencyColor,
          fontWeight: 700,
          letterSpacing: 0.5,
          opacity: 0.8,
        }}>
          {deadlineLabel}
        </div>
      </div>

      {/* Scrolling ticker */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', paddingLeft: 14 }}>
        <div
          key={refreshKey}
          style={{
            display: 'inline-block',
            whiteSpace: 'nowrap',
            fontSize: 11,
            color: trades.length > 0 ? '#ccc' : T.textDim,
            animation: trades.length > 0
              ? `tradeTickerScroll ${Math.max(20, trades.length * 8)}s linear infinite`
              : 'none',
          }}
        >
          {repeatText}
        </div>
      </div>

      <style>{`
        @keyframes tradeTickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
