import { describe, it, expect } from 'vitest';

// ── Inline derived stat formulas from StatsService.ts ────────────────────────
// These are the formulas applied to raw DB rows before returning to the UI.
// Regressions here would silently show wrong numbers in every stats table.

interface RawTeamRow {
  games: number;
  points_for: number;
  points_against: number;
  pass_yards?: number;
  rush_yards?: number;
  off_yards?: number;
  pass_attempts?: number;
  completions?: number;
  rush_attempts?: number;
  fg_made?: number;
  fg_att?: number;
  xp_made?: number;
  xp_att?: number;
  turnovers_taken?: number;
  turnovers_given?: number;
  sacks?: number;
  def_ints?: number;
}

function deriveTeamStats(t: RawTeamRow) {
  const g = Math.max(t.games, 1);
  return {
    ppg:          Math.round((t.points_for    / g) * 10) / 10,
    papg:         Math.round((t.points_against / g) * 10) / 10,
    ypg:          Math.round((t.off_yards     ?? 0) / g),
    pass_ypg:     Math.round((t.pass_yards    ?? 0) / g),
    rush_ypg:     Math.round((t.rush_yards    ?? 0) / g),
    cmp_pct:      (t.pass_attempts ?? 0) > 0
                    ? Math.round(((t.completions ?? 0) / t.pass_attempts!) * 100)
                    : 0,
    fg_pct:       (t.fg_att ?? 0) > 0
                    ? Math.round(((t.fg_made ?? 0) / t.fg_att!) * 100)
                    : 0,
    to_diff:      (t.turnovers_taken ?? 0) - (t.turnovers_given ?? 0),
    to_given:     t.turnovers_given  ?? 0,
    to_taken:     t.turnovers_taken  ?? 0,
    rush_att_pg:  Math.round(((t.rush_attempts ?? 0) / g) * 10) / 10,
    sacks:        t.sacks    ?? 0,
    def_ints:     t.def_ints ?? 0,
    fg_made:      t.fg_made  ?? 0,
    fg_att:       t.fg_att   ?? 0,
    xp_made:      t.xp_made  ?? 0,
    xp_att:       t.xp_att   ?? 0,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ppg and papg', () => {
  it('calculates correct PPG', () => {
    const stats = deriveTeamStats({ games: 16, points_for: 432, points_against: 320 });
    expect(stats.ppg).toBe(27.0);
    expect(stats.papg).toBe(20.0);
  });

  it('rounds PPG to 1 decimal place', () => {
    const stats = deriveTeamStats({ games: 16, points_for: 435, points_against: 320 });
    expect(stats.ppg).toBe(27.2);
  });

  it('guards against division by zero when games = 0', () => {
    const stats = deriveTeamStats({ games: 0, points_for: 100, points_against: 50 });
    expect(isFinite(stats.ppg)).toBe(true);
    expect(isFinite(stats.papg)).toBe(true);
  });
});

describe('yards per game', () => {
  it('calculates total YPG correctly', () => {
    const stats = deriveTeamStats({
      games: 16, points_for: 400, points_against: 300,
      off_yards: 5600, pass_yards: 3800, rush_yards: 1800,
    });
    expect(stats.ypg).toBe(350);
    expect(stats.pass_ypg).toBe(238);
    expect(stats.rush_ypg).toBe(113);
  });

  it('pass_ypg + rush_ypg equals ypg when division is exact', () => {
    const stats = deriveTeamStats({
      games: 16, points_for: 400, points_against: 300,
      off_yards: 5120, pass_yards: 3200, rush_yards: 1920,
    });
    expect(stats.pass_ypg + stats.rush_ypg).toBe(stats.ypg);
  });

  it('defaults missing yard fields to 0', () => {
    const stats = deriveTeamStats({ games: 8, points_for: 200, points_against: 150 });
    expect(stats.ypg).toBe(0);
    expect(stats.pass_ypg).toBe(0);
    expect(stats.rush_ypg).toBe(0);
  });
});

describe('completion percentage', () => {
  it('calculates cmp_pct as integer percentage', () => {
    const stats = deriveTeamStats({
      games: 16, points_for: 400, points_against: 300,
      pass_attempts: 500, completions: 325,
    });
    expect(stats.cmp_pct).toBe(65);
  });

  it('returns 0 when no pass attempts (avoids NaN)', () => {
    const stats = deriveTeamStats({ games: 16, points_for: 400, points_against: 300, pass_attempts: 0 });
    expect(stats.cmp_pct).toBe(0);
  });

  it('cmp_pct is always between 0 and 100', () => {
    for (const [comp, att] of [[0, 40], [30, 40], [40, 40]]) {
      const stats = deriveTeamStats({
        games: 10, points_for: 200, points_against: 200,
        pass_attempts: att, completions: comp,
      });
      expect(stats.cmp_pct).toBeGreaterThanOrEqual(0);
      expect(stats.cmp_pct).toBeLessThanOrEqual(100);
    }
  });
});

describe('field goal percentage', () => {
  it('calculates fg_pct correctly', () => {
    const stats = deriveTeamStats({
      games: 16, points_for: 350, points_against: 300,
      fg_made: 30, fg_att: 35,
    });
    expect(stats.fg_pct).toBe(86);
  });

  it('returns 0 when no FG attempts (avoids NaN)', () => {
    const stats = deriveTeamStats({ games: 16, points_for: 350, points_against: 300, fg_att: 0 });
    expect(stats.fg_pct).toBe(0);
  });

  it('perfect FG accuracy returns 100', () => {
    const stats = deriveTeamStats({
      games: 16, points_for: 350, points_against: 300,
      fg_made: 25, fg_att: 25,
    });
    expect(stats.fg_pct).toBe(100);
  });
});

describe('turnover differential', () => {
  it('positive when takeaways exceed giveaways', () => {
    const stats = deriveTeamStats({
      games: 16, points_for: 400, points_against: 280,
      turnovers_taken: 28, turnovers_given: 18,
    });
    expect(stats.to_diff).toBe(10);
  });

  it('negative when giveaways exceed takeaways', () => {
    const stats = deriveTeamStats({
      games: 16, points_for: 280, points_against: 400,
      turnovers_taken: 14, turnovers_given: 26,
    });
    expect(stats.to_diff).toBe(-12);
  });

  it('zero when balanced', () => {
    const stats = deriveTeamStats({
      games: 16, points_for: 350, points_against: 350,
      turnovers_taken: 20, turnovers_given: 20,
    });
    expect(stats.to_diff).toBe(0);
  });

  it('defaults to 0 when turnovers fields are missing', () => {
    const stats = deriveTeamStats({ games: 16, points_for: 350, points_against: 300 });
    expect(stats.to_diff).toBe(0);
    expect(stats.to_given).toBe(0);
    expect(stats.to_taken).toBe(0);
  });
});

describe('rush attempts per game', () => {
  it('rounds to 1 decimal', () => {
    const stats = deriveTeamStats({
      games: 16, points_for: 350, points_against: 300,
      rush_attempts: 450,
    });
    expect(stats.rush_att_pg).toBe(28.1);
  });
});
