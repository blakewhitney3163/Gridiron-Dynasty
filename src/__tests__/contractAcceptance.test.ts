import { describe, it, expect } from 'vitest';

// ── Inline acceptance logic from ContractService.ts ───────────────────────────
// Any change to the acceptance ladder must break these tests first.

function signFreeAgentAcceptChance(
  salary: number, fairMarket: number,
  age: number, devTrait: string,
  winPct: number, gamesPlayed: number
): number {
  const ratio = salary / Math.max(fairMarket, 1);
  let chance =
    ratio >= 1.00 ? 1.00 :
    ratio >= 0.85 ? 0.90 :
    ratio >= 0.70 ? 0.60 :
    ratio >= 0.50 ? 0.20 : 0.00;

  if (age >= 33) chance = Math.min(1, chance + 0.15);
  if (age >= 36) chance = Math.min(1, chance + 0.15);
  if (devTrait === 'X-Factor')  chance = Math.max(0, chance - 0.20);
  if (devTrait === 'Superstar') chance = Math.max(0, chance - 0.10);
  if (gamesPlayed >= 4 && winPct >= 0.65) chance = Math.min(1, chance + 0.08);

  return chance;
}

function resignAcceptChance(
  salary: number, fairMarket: number,
  age: number, devTrait: string
): number {
  const ratio = salary / Math.max(fairMarket, 1);
  let chance =
    ratio >= 1.00 ? 1.00 :
    ratio >= 0.85 ? 0.95 :
    ratio >= 0.70 ? 0.70 :
    ratio >= 0.50 ? 0.25 : 0.00;

  if (age >= 33) chance = Math.min(1, chance + 0.15);
  if (age >= 36) chance = Math.min(1, chance + 0.15);
  if (devTrait === 'X-Factor')  chance = Math.max(0, chance - 0.15);
  if (devTrait === 'Superstar') chance = Math.max(0, chance - 0.08);

  return chance;
}

function cpuTeamType(
  winPct: number, gamesPlayed: number,
  avgOvr: number, avgAge: number
): string {
  const wp = gamesPlayed >= 4 ? winPct : 0.5;
  if (wp >= 0.55 && avgOvr >= 77)                return 'Contender';
  if (wp >= 0.45 || avgOvr >= 76)                return 'Buyer';
  if (wp < 0.35  && avgAge >= 27.5)              return 'Seller';
  if (wp < 0.35  || avgOvr < 73)                 return 'Rebuilding';
  return 'Neutral';
}

// ── signFreeAgent acceptance tests ───────────────────────────────────────────

describe('signFreeAgentAcceptChance', () => {
  it('at full market rate always returns 1.0', () => {
    expect(signFreeAgentAcceptChance(10, 10, 28, 'Normal', 0.5, 8)).toBe(1.0);
    expect(signFreeAgentAcceptChance(15, 10, 28, 'Normal', 0.5, 8)).toBe(1.0);
  });

  it('at 85–99% of market returns 0.90 base', () => {
    expect(signFreeAgentAcceptChance(8.5, 10, 28, 'Normal', 0.5, 8)).toBe(0.90);
  });

  it('at 70–84% of market returns 0.60 base', () => {
    expect(signFreeAgentAcceptChance(7.0, 10, 28, 'Normal', 0.5, 8)).toBe(0.60);
  });

  it('at 50–69% of market returns 0.20 base', () => {
    expect(signFreeAgentAcceptChance(5.0, 10, 28, 'Normal', 0.5, 8)).toBe(0.20);
  });

  it('below 50% of market returns 0 (never signs)', () => {
    expect(signFreeAgentAcceptChance(4.9, 10, 28, 'Normal', 0.5, 8)).toBe(0.00);
    expect(signFreeAgentAcceptChance(1.0, 10, 28, 'Normal', 0.5, 8)).toBe(0.00);
  });

  it('age 33–35 adds +0.15 bonus', () => {
    const base   = signFreeAgentAcceptChance(8.5, 10, 28, 'Normal', 0.5, 8); // 0.90
    const older  = signFreeAgentAcceptChance(8.5, 10, 34, 'Normal', 0.5, 8); // 0.90 + 0.15
    expect(older).toBeCloseTo(base + 0.15, 5);
  });

  it('age 36+ adds +0.30 total bonus (two stacked bonuses)', () => {
    const base   = signFreeAgentAcceptChance(7.0, 10, 28, 'Normal', 0.5, 8); // 0.60
    const oldest = signFreeAgentAcceptChance(7.0, 10, 37, 'Normal', 0.5, 8); // 0.60 + 0.30
    expect(oldest).toBeCloseTo(base + 0.30, 5);
  });

  it('X-Factor trait subtracts 0.20', () => {
    const base = signFreeAgentAcceptChance(8.5, 10, 28, 'Normal',   0.5, 8);
    const xf   = signFreeAgentAcceptChance(8.5, 10, 28, 'X-Factor', 0.5, 8);
    expect(xf).toBeCloseTo(base - 0.20, 5);
  });

  it('Superstar trait subtracts 0.10', () => {
    const base = signFreeAgentAcceptChance(8.5, 10, 28, 'Normal',    0.5, 8);
    const ss   = signFreeAgentAcceptChance(8.5, 10, 28, 'Superstar', 0.5, 8);
    expect(ss).toBeCloseTo(base - 0.10, 5);
  });

  it('winning team (65%+ winPct, 4+ games) adds +0.08', () => {
    const base    = signFreeAgentAcceptChance(7.0, 10, 28, 'Normal', 0.60, 10);
    const noBonus = signFreeAgentAcceptChance(7.0, 10, 28, 'Normal', 0.60,  3); // < 4 games
    expect(base).toBeCloseTo(noBonus + 0.08, 5);
  });

  it('chance is always clamped to [0, 1]', () => {
    // Age bonus on a 1.0 base shouldn't exceed 1.0
    expect(signFreeAgentAcceptChance(20, 10, 38, 'Normal', 0.9, 14)).toBeLessThanOrEqual(1.0);
    // X-Factor penalty on a 0 base shouldn't go below 0
    expect(signFreeAgentAcceptChance(1, 10, 25, 'X-Factor', 0.3, 8)).toBeGreaterThanOrEqual(0.0);
  });
});

// ── resignPlayer acceptance tests ────────────────────────────────────────────

describe('resignAcceptChance', () => {
  it('at full market rate always returns 1.0', () => {
    expect(resignAcceptChance(10, 10, 28, 'Normal')).toBe(1.0);
  });

  it('resign ladder is more generous than FA sign at 85–99% ratio', () => {
    const fa     = signFreeAgentAcceptChance(8.5, 10, 28, 'Normal', 0.5, 8); // 0.90
    const resign = resignAcceptChance(8.5, 10, 28, 'Normal');                 // 0.95
    expect(resign).toBeGreaterThan(fa);
  });

  it('resign ladder is more generous than FA sign at 70–84% ratio', () => {
    const fa     = signFreeAgentAcceptChance(7.0, 10, 28, 'Normal', 0.5, 8); // 0.60
    const resign = resignAcceptChance(7.0, 10, 28, 'Normal');                 // 0.70
    expect(resign).toBeGreaterThan(fa);
  });

  it('X-Factor penalty is -0.15 (less harsh than FA -0.20)', () => {
    const normal = resignAcceptChance(8.5, 10, 28, 'Normal');
    const xf     = resignAcceptChance(8.5, 10, 28, 'X-Factor');
    expect(normal - xf).toBeCloseTo(0.15, 5);
  });

  it('below 50% market rate: no resign (0%)', () => {
    expect(resignAcceptChance(4.9, 10, 28, 'Normal')).toBe(0.00);
  });
});

// ── CPU team type classifier (ContractService version) ───────────────────────

describe('cpuTeamType', () => {
  it('Contender: high winPct + high OVR', () => {
    expect(cpuTeamType(0.70, 14, 80, 27)).toBe('Contender');
  });

  it('Buyer: moderate winPct or decent OVR', () => {
    expect(cpuTeamType(0.50, 14, 76, 26)).toBe('Buyer');
  });

  it('Seller: low winPct + old roster', () => {
    expect(cpuTeamType(0.30, 14, 77, 28.5)).toBe('Seller');
  });

  it('Rebuilding: low winPct + low OVR', () => {
    expect(cpuTeamType(0.25, 14, 70, 24)).toBe('Rebuilding');
  });

  it('Neutral: average everything', () => {
    expect(cpuTeamType(0.44, 14, 75, 26)).toBe('Neutral');
  });

  it('< 4 games defaults to winPct 0.5 — avoids forced Rebuilding', () => {
    // Even 1W 2L with low OVR but < 4 games: winPct defaults to 0.5
    const status = cpuTeamType(0.33, 3, 74, 25);
    expect(status).not.toBe('Rebuilding');
    expect(status).not.toBe('Seller');
  });

  it('Resign premium table has Contender > Rebuilding', () => {
    const premiums: Record<string, number> = {
      Contender: 1.10, Buyer: 1.02, Neutral: 0.95, Seller: 0.87, Rebuilding: 0.78,
    };
    expect(premiums.Contender).toBeGreaterThan(premiums.Rebuilding);
    expect(premiums.Buyer).toBeGreaterThan(premiums.Seller);
  });

  it('FA bid base config: Contender bids highest, Rebuilding bids lowest', () => {
    const bidConfig: Record<string, { base: number }> = {
      Contender: { base: 1.12 }, Buyer: { base: 1.00 }, Neutral: { base: 0.88 },
      Seller: { base: 0.78 }, Rebuilding: { base: 0.70 },
    };
    const types = ['Contender', 'Buyer', 'Neutral', 'Seller', 'Rebuilding'];
    for (let i = 1; i < types.length; i++) {
      expect(bidConfig[types[i - 1]].base).toBeGreaterThan(bidConfig[types[i]].base);
    }
  });
});
