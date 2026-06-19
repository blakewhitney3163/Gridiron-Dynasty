import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Career stat aggregation (inline from checkMilestones.ts) ─────────────────

interface StatRow {
  pass_yards?: number; pass_tds?: number;
  rush_yards?: number; rush_tds?: number;
  rec_yards?: number;  rec_tds?: number;
  receptions?: number; sacks?: number; def_interceptions?: number;
}

function computeCareer(history: StatRow, current: StatRow): Required<StatRow> {
  return {
    pass_yards:        (history.pass_yards        ?? 0) + (current.pass_yards        ?? 0),
    pass_tds:          (history.pass_tds          ?? 0) + (current.pass_tds          ?? 0),
    rush_yards:        (history.rush_yards        ?? 0) + (current.rush_yards        ?? 0),
    rush_tds:          (history.rush_tds          ?? 0) + (current.rush_tds          ?? 0),
    rec_yards:         (history.rec_yards         ?? 0) + (current.rec_yards         ?? 0),
    rec_tds:           (history.rec_tds           ?? 0) + (current.rec_tds           ?? 0),
    receptions:        (history.receptions        ?? 0) + (current.receptions        ?? 0),
    sacks:             (history.sacks             ?? 0) + (current.sacks             ?? 0),
    def_interceptions: (history.def_interceptions ?? 0) + (current.def_interceptions ?? 0),
  };
}

// Mirrors the threshold arrays in checkMilestones.ts
const CAREER_PASS_YD  = [10000, 20000, 30000, 40000, 50000];
const CAREER_PASS_TD  = [100, 200, 300, 400];
const CAREER_RUSH_YD  = [5000, 10000, 15000];
const CAREER_RUSH_TD  = [50, 100];
const CAREER_REC_YD   = [5000, 10000, 15000];
const CAREER_REC_TD   = [50, 100];
const CAREER_REC      = [500, 750, 1000];
const CAREER_SACKS    = [50, 100, 150];
const CAREER_DEF_INT  = [25, 50];

const SEASON_THRESHOLDS = [
  { key: 'pass_5000',    stat: 'pass_yards', value: 5000  },
  { key: 'pass_td_50',   stat: 'pass_tds',   value: 50    },
  { key: 'rush_2000',    stat: 'rush_yards', value: 2000  },
  { key: 'rec_2000',     stat: 'rec_yards',  value: 2000  },
  { key: 'rush_td_20',   stat: 'rush_tds',   value: 20    },
];

function getTriggeredCareerMilestones(career: Required<StatRow>, achieved: Set<string>, playerId: number): string[] {
  const triggered: string[] = [];
  const check = (key: string) => {
    const full = `${playerId}:${key}`;
    if (!achieved.has(full)) { achieved.add(full); triggered.push(key); }
  };
  for (const t of CAREER_PASS_YD)  if (career.pass_yards        >= t) check(`pass_yd_${t}`);
  for (const t of CAREER_PASS_TD)  if (career.pass_tds          >= t) check(`pass_td_${t}`);
  for (const t of CAREER_RUSH_YD)  if (career.rush_yards        >= t) check(`rush_yd_${t}`);
  for (const t of CAREER_RUSH_TD)  if (career.rush_tds          >= t) check(`rush_td_${t}`);
  for (const t of CAREER_REC_YD)   if (career.rec_yards         >= t) check(`rec_yd_${t}`);
  for (const t of CAREER_REC_TD)   if (career.rec_tds           >= t) check(`rec_td_${t}`);
  for (const t of CAREER_REC)      if (career.receptions        >= t) check(`rec_${t}`);
  for (const t of CAREER_SACKS)    if (career.sacks             >= t) check(`sacks_${t}`);
  for (const t of CAREER_DEF_INT)  if (career.def_interceptions >= t) check(`def_int_${t}`);
  return triggered;
}

function getTriggeredSeasonMilestones(current: StatRow, achieved: Set<string>, playerId: number, season: number): string[] {
  const triggered: string[] = [];
  for (const { key, stat, value } of SEASON_THRESHOLDS) {
    const full = `${playerId}:s${season}_${key}`;
    if ((current[stat as keyof StatRow] ?? 0) >= value && !achieved.has(full)) {
      achieved.add(full);
      triggered.push(key);
    }
  }
  return triggered;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('computeCareer', () => {
  it('sums history and current season stats', () => {
    const career = computeCareer(
      { pass_yards: 25000, pass_tds: 180 },
      { pass_yards: 4200,  pass_tds: 32  }
    );
    expect(career.pass_yards).toBe(29200);
    expect(career.pass_tds).toBe(212);
  });

  it('handles missing fields with 0 defaults', () => {
    const career = computeCareer({}, { pass_yards: 1000 });
    expect(career.pass_yards).toBe(1000);
    expect(career.rush_yards).toBe(0);
    expect(career.sacks).toBe(0);
  });

  it('both empty rows produce all zeros', () => {
    const career = computeCareer({}, {});
    Object.values(career).forEach(v => expect(v).toBe(0));
  });
});

describe('career milestone triggers', () => {
  it('fires pass_yd_10000 when career passes 10k yards', () => {
    const career = computeCareer({ pass_yards: 8000 }, { pass_yards: 2500 });
    const achieved = new Set<string>();
    const triggered = getTriggeredCareerMilestones(career, achieved, 1);
    expect(triggered).toContain('pass_yd_10000');
  });

  it('fires multiple passing yard milestones at once if crossing several thresholds', () => {
    const career = computeCareer({ pass_yards: 0 }, { pass_yards: 32000 });
    const achieved = new Set<string>();
    const triggered = getTriggeredCareerMilestones(career, achieved, 1);
    expect(triggered).toContain('pass_yd_10000');
    expect(triggered).toContain('pass_yd_20000');
    expect(triggered).toContain('pass_yd_30000');
    expect(triggered).not.toContain('pass_yd_40000');
  });

  it('does NOT fire below threshold', () => {
    const career = computeCareer({ pass_yards: 5000 }, { pass_yards: 4000 });
    const achieved = new Set<string>();
    const triggered = getTriggeredCareerMilestones(career, achieved, 1);
    expect(triggered).not.toContain('pass_yd_10000');
  });

  it('deduplication: same milestone never fires twice for same player', () => {
    const career = computeCareer({ pass_yards: 25000 }, { pass_yards: 0 });
    const achieved = new Set<string>(['1:pass_yd_10000', '1:pass_yd_20000']);
    const triggered = getTriggeredCareerMilestones(career, achieved, 1);
    expect(triggered).not.toContain('pass_yd_10000');
    expect(triggered).not.toContain('pass_yd_20000');
  });

  it('same milestone fires for different player IDs independently', () => {
    const career = computeCareer({ rush_yards: 5500 }, {});
    const achieved = new Set<string>();
    const t1 = getTriggeredCareerMilestones(career, achieved, 1);
    const t2 = getTriggeredCareerMilestones(career, achieved, 2);
    expect(t1).toContain('rush_yd_5000');
    expect(t2).toContain('rush_yd_5000');
  });

  it('fires sack milestones at correct thresholds', () => {
    const career = computeCareer({ sacks: 45 }, { sacks: 10 });
    const achieved = new Set<string>();
    const triggered = getTriggeredCareerMilestones(career, achieved, 1);
    expect(triggered).toContain('sacks_50');
    expect(triggered).not.toContain('sacks_100');
  });
});

describe('single-season milestone triggers', () => {
  it('fires pass_5000 at 5000+ passing yards', () => {
    const triggered = getTriggeredSeasonMilestones({ pass_yards: 5100 }, new Set(), 1, 2025);
    expect(triggered).toContain('pass_5000');
  });

  it('does NOT fire pass_5000 below threshold', () => {
    const triggered = getTriggeredSeasonMilestones({ pass_yards: 4999 }, new Set(), 1, 2025);
    expect(triggered).not.toContain('pass_5000');
  });

  it('is scoped per season — same milestone can fire in a different season', () => {
    const achieved = new Set<string>(['1:s2024_pass_5000']);
    const triggered = getTriggeredSeasonMilestones({ pass_yards: 5200 }, achieved, 1, 2025);
    expect(triggered).toContain('pass_5000');
  });

  it('does NOT fire same season milestone twice', () => {
    const achieved = new Set<string>(['1:s2025_rush_2000']);
    const triggered = getTriggeredSeasonMilestones({ rush_yards: 2100 }, achieved, 1, 2025);
    expect(triggered).not.toContain('rush_2000');
  });

  it('fires rush_td_20 at 20+ rushing TDs', () => {
    const triggered = getTriggeredSeasonMilestones({ rush_tds: 21 }, new Set(), 5, 2025);
    expect(triggered).toContain('rush_td_20');
  });
});
