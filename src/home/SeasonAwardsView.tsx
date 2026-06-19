import React from 'react';
import { T } from '../theme';

interface AwardPlayer {
  name?: string;
  position?: string;
  age?: number;
  overall_rating?: number;
  dev_trait?: string;
  team_name?: string;
  team_city?: string;
  city?: string;
  pass_yards?: number;
  pass_tds?: number;
  interceptions?: number;
  rush_yards?: number;
  rush_tds?: number;
  rec_yards?: number;
  rec_tds?: number;
  receptions?: number;
  tackles?: number;
  sacks?: number;
  def_interceptions?: number;
  forced_fumbles?: number;
  wins?: number;
  games?: number;
}

interface SeasonAwards {
  mvp:   AwardPlayer | null;
  opoy:  AwardPlayer | null;
  dpoy:  AwardPlayer | null;
  oroty: AwardPlayer | null;
  droty: AwardPlayer | null;
  coy:   AwardPlayer | null;
}

interface Props {
  awards: SeasonAwards | null;
  season: number;
}

const TRAIT_COLOR: Record<string, string> = {
  'X-Factor': '#FFD700',
  Superstar:  '#C084FC',
  Star:       '#4FC3F7',
  Normal:     '#9CA3AF',
};

const RB_POS  = ['RB', 'HB', 'FB'];
const WR_POS  = ['WR', 'TE'];
const DL_POS  = ['DL', 'DE', 'DT', 'LE', 'RE', 'IDL'];
const LB_POS  = ['LB', 'MLB', 'OLB', 'LOLB', 'ROLB', 'ILB', 'WILL', 'MIKE'];
const DB_POS  = ['CB', 'S', 'FS', 'SS'];

function statLine(p: AwardPlayer): string {
  const pos = p.position ?? '';
  if (pos === 'QB')
    return `${(p.pass_yards ?? 0).toLocaleString()} YDS · ${p.pass_tds ?? 0} TD · ${p.interceptions ?? 0} INT`;
  if (RB_POS.includes(pos))
    return `${(p.rush_yards ?? 0).toLocaleString()} YDS · ${p.rush_tds ?? 0} TD`;
  if (WR_POS.includes(pos))
    return `${p.receptions ?? 0} REC · ${(p.rec_yards ?? 0).toLocaleString()} YDS · ${p.rec_tds ?? 0} TD`;
  if (DL_POS.includes(pos))
    return `${p.sacks ?? 0} SCK · ${p.tackles ?? 0} TKL · ${p.forced_fumbles ?? 0} FF`;
  if (LB_POS.includes(pos))
    return `${p.tackles ?? 0} TKL · ${p.sacks ?? 0} SCK`;
  if (DB_POS.includes(pos))
    return `${p.def_interceptions ?? 0} INT · ${p.tackles ?? 0} TKL`;
  return `${p.overall_rating ?? 0} OVR`;
}

function AwardCard({
  label, icon, player, isCOY = false,
}: {
  label: string;
  icon: string;
  player: AwardPlayer | null;
  isCOY?: boolean;
}) {
  if (!player) return null;

  const traitColor  = TRAIT_COLOR[player.dev_trait ?? 'Normal'] ?? '#9CA3AF';
  const teamDisplay = isCOY
    ? `${player.city ?? ''} ${player.team_name ?? ''}`.trim()
    : `${player.team_city ?? ''} ${player.team_name ?? ''}`.trim();

  return (
    <div style={{
      background: T.bgCard,
      border: `1px solid ${T.borderFaint}`,
      borderRadius: 6,
      padding: '14px 16px',
      flex: '1 1 190px',
      maxWidth: 250,
      minWidth: 170,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 2, color: T.textDim }}>
          {label}
        </span>
      </div>

      {isCOY ? (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3 }}>
            {teamDisplay}
          </div>
          <div style={{ fontSize: 10, color: '#4caf50', fontWeight: 600 }}>
            {player.wins ?? 0} WINS
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3 }}>
            {player.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
            <span style={{
              fontSize: 9, color: traitColor,
              border: `1px solid ${traitColor}`, borderRadius: 2, padding: '1px 4px',
            }}>
              {player.position}
            </span>
            <span style={{ fontSize: 9, color: T.textDim }}>{player.age}yr</span>
            <span style={{ fontSize: 9, color: T.textDim }}>{player.overall_rating} OVR</span>
          </div>
          <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 5 }}>
            {teamDisplay}
          </div>
          <div style={{ fontSize: 10, color: '#4FC3F7', fontWeight: 600 }}>
            {statLine(player)}
          </div>
        </>
      )}
    </div>
  );
}

export default function SeasonAwardsView({ awards, season }: Props) {
  if (!awards) return null;
  const { mvp, opoy, dpoy, oroty, droty, coy } = awards;
  if (!mvp && !opoy && !dpoy && !oroty && !droty && !coy) return null;

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 16 }}>🏆</span>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: T.textMuted }}>
          {season} SEASON AWARDS
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <AwardCard label="LEAGUE MVP"              icon="🏆" player={mvp}   />
        <AwardCard label="OFFENSIVE PLAYER"        icon="⚡" player={opoy}  />
        <AwardCard label="DEFENSIVE PLAYER"        icon="🛡️"  player={dpoy}  />
        <AwardCard label="OFFENSIVE ROOKIE"        icon="⭐" player={oroty} />
        <AwardCard label="DEFENSIVE ROOKIE"        icon="🌟" player={droty} />
        <AwardCard label="COACH OF THE YEAR"       icon="📋" player={coy}   isCOY />
      </div>
    </div>
  );
}
