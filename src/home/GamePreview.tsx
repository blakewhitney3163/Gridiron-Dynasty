import React from 'react';
import { T } from '../theme';
import { FranchiseHealth } from './types';

interface SchemeData {
  offenseScheme: string;
  defenseScheme: string;
}

interface GamePreviewProps {
  userTeamName: string;
  userRecord: { wins: number; losses: number };
  userHealth: FranchiseHealth;
  userScheme: SchemeData;
  userIsHome: boolean;
  oppTeamName: string;
  oppRecord: { wins: number; losses: number };
  oppHealth: FranchiseHealth;
  oppScheme: SchemeData;
}

const ovrColor = (v: number) => v >= 80 ? T.green : v >= 70 ? T.orange : T.red;

function RatingRow({ label, userVal, oppVal }: { label: string; userVal: number; oppVal: number }) {
  const userColor = ovrColor(userVal);
  const oppColor = ovrColor(oppVal);
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: userColor, width: 24, textAlign: 'right' }}>{userVal}</span>
        {/* User bar — fills right to left */}
        <div style={{ flex: 1, height: 5, background: T.bgDeep, borderRadius: '3px 0 0 3px', overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: `${(userVal / 99) * 100}%`, height: '100%', background: userColor, borderRadius: '3px 0 0 3px' }} />
        </div>
        <span style={{ fontSize: 8, color: T.textDim, width: 52, textAlign: 'center', flexShrink: 0 }}>{label}</span>
        {/* Opp bar — fills left to right */}
        <div style={{ flex: 1, height: 5, background: T.bgDeep, borderRadius: '0 3px 3px 0', overflow: 'hidden' }}>
          <div style={{ width: `${(oppVal / 99) * 100}%`, height: '100%', background: oppColor, borderRadius: '0 3px 3px 0' }} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: oppColor, width: 24 }}>{oppVal}</span>
      </div>
    </div>
  );
}

export default function GamePreview({
  userTeamName, userRecord, userHealth, userScheme, userIsHome,
  oppTeamName, oppRecord, oppHealth, oppScheme,
}: GamePreviewProps) {
  const userStr = (userHealth.offense_ovr + userHealth.defense_ovr) / 2;
  const oppStr = (oppHealth.offense_ovr + oppHealth.defense_ovr) / 2;
  const rawWinPct = Math.min(95, Math.max(5, Math.round(50 + (userStr - oppStr) * 2)));
  const probColor = rawWinPct > 58 ? T.green : rawWinPct < 42 ? T.red : T.orange;

  return (
    <div style={{ marginBottom: 10 }}>
      {/* Team header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary, marginBottom: 1 }}>{userTeamName}</div>
          <div style={{ fontSize: 10, color: T.textMuted }}>{userRecord.wins}–{userRecord.losses}</div>
          <div style={{ fontSize: 8, color: T.orange, marginTop: 2, fontWeight: 600 }}>{userIsHome ? 'HOME' : 'AWAY'}</div>
        </div>
        <div style={{ padding: '2px 10px', fontSize: 10, fontWeight: 700, color: T.textDim }}>VS</div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary, marginBottom: 1 }}>{oppTeamName}</div>
          <div style={{ fontSize: 10, color: T.textMuted }}>{oppRecord.wins}–{oppRecord.losses}</div>
          <div style={{ fontSize: 8, color: T.textDim, marginTop: 2, fontWeight: 600 }}>{userIsHome ? 'AWAY' : 'HOME'}</div>
        </div>
      </div>

      {/* Rating bars */}
      <div style={{ padding: '8px 6px', background: T.bgDeep, borderRadius: 6, marginBottom: 8 }}>
        <RatingRow label="OFFENSE" userVal={userHealth.offense_ovr} oppVal={oppHealth.offense_ovr} />
        <RatingRow label="DEFENSE" userVal={userHealth.defense_ovr} oppVal={oppHealth.defense_ovr} />
        <RatingRow label="OVERALL" userVal={userHealth.overall_ovr} oppVal={oppHealth.overall_ovr} />
      </div>

      {/* Schemes */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <div style={{ flex: 1, padding: '5px 8px', background: T.bgDeep, borderRadius: 5 }}>
          <div style={{ fontSize: 8, color: T.textDim, marginBottom: 2 }}>OFF</div>
          <div style={{ fontSize: 9, color: T.orange, fontWeight: 600 }}>{userScheme.offenseScheme}</div>
          <div style={{ fontSize: 8, color: T.textDim, marginTop: 4 }}>DEF</div>
          <div style={{ fontSize: 9, color: T.blue, fontWeight: 600 }}>{userScheme.defenseScheme}</div>
        </div>
        <div style={{ width: 1, background: T.borderFaint }} />
        <div style={{ flex: 1, padding: '5px 8px', background: T.bgDeep, borderRadius: 5, textAlign: 'right' }}>
          <div style={{ fontSize: 8, color: T.textDim, marginBottom: 2 }}>OFF</div>
          <div style={{ fontSize: 9, color: T.orange, fontWeight: 600 }}>{oppScheme.offenseScheme}</div>
          <div style={{ fontSize: 8, color: T.textDim, marginTop: 4 }}>DEF</div>
          <div style={{ fontSize: 9, color: T.blue, fontWeight: 600 }}>{oppScheme.defenseScheme}</div>
        </div>
      </div>

      {/* Win probability */}
      <div style={{ padding: '6px 8px', background: T.bgDeep, borderRadius: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 4 }}>
          <span style={{ color: probColor, fontWeight: 700 }}>{rawWinPct}%</span>
          <span style={{ color: T.textDim }}>WIN PROBABILITY</span>
          <span style={{ color: T.textDim, fontWeight: 700 }}>{100 - rawWinPct}%</span>
        </div>
        <div style={{ height: 6, background: T.borderMid, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${rawWinPct}%`, background: probColor, borderRadius: 3, transition: 'width 0.4s ease' }} />
        </div>
      </div>
    </div>
  );
}
