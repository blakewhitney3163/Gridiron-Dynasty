import { describe, it, expect, vi } from 'vitest';

vi.mock('../database', () => ({
  db: {
    prepare: vi.fn(() => ({ get: vi.fn(() => null), all: vi.fn(() => []), run: vi.fn(() => ({ changes: 1 })) })),
    transaction: vi.fn((fn: any) => () => fn()),
    exec: vi.fn(),
  },
}));
vi.mock('../repositories', () => ({
  playerRepo: { getById: vi.fn(), getByTeam: vi.fn(() => []), updateTeam: vi.fn() },
  contractRepo: { updateTeam: vi.fn() },
  gameRepo: { getTeamRecord: vi.fn(() => ({ wins: 5, losses: 5, ties: 0 })), getCurrentWeek: vi.fn(() => 5), countBySeason: vi.fn(() => 10) },
  pickRepo: { getById: vi.fn(), getByTeam: vi.fn(() => []), transfer: vi.fn() },
}));
vi.mock('../helpers/getCurrentSeason', () => ({ getCurrentSeason: vi.fn(() => 2024) }));
vi.mock('../helpers/logNewsEvent', () => ({ logNewsEvent: vi.fn() }));

import { calcPlayerTradeValue, calcPickTradeValue } from '../services/TradeService';

describe('calcPlayerTradeValue', () => {
  it('younger players are worth more than older at the same OVR', () => {
    const young = calcPlayerTradeValue(85, 22, 'QB', 'Normal');
    const old   = calcPlayerTradeValue(85, 35, 'QB', 'Normal');
    expect(young).toBeGreaterThan(old);
  });

  it('X-Factor players are worth more than Normal', () => {
    const normal  = calcPlayerTradeValue(85, 26, 'WR', 'Normal');
    const xFactor = calcPlayerTradeValue(85, 26, 'WR', 'X-Factor');
    expect(xFactor).toBeGreaterThan(normal);
  });

  it('QB position commands a premium over RB', () => {
    const qb = calcPlayerTradeValue(82, 26, 'QB', 'Normal');
    const rb = calcPlayerTradeValue(82, 26, 'RB', 'Normal');
    expect(qb).toBeGreaterThan(rb);
  });

  it('returns a positive number for any valid input', () => {
    expect(calcPlayerTradeValue(70, 30, 'K', 'Normal')).toBeGreaterThan(0);
  });

  it('higher OVR always increases value', () => {
    const low  = calcPlayerTradeValue(70, 26, 'WR', 'Normal');
    const high = calcPlayerTradeValue(90, 26, 'WR', 'Normal');
    expect(high).toBeGreaterThan(low);
  });

  it('dev trait order: Normal < Star < Superstar < X-Factor', () => {
    const n  = calcPlayerTradeValue(85, 26, 'QB', 'Normal');
    const s  = calcPlayerTradeValue(85, 26, 'QB', 'Star');
    const ss = calcPlayerTradeValue(85, 26, 'QB', 'Superstar');
    const xf = calcPlayerTradeValue(85, 26, 'QB', 'X-Factor');
    expect(s).toBeGreaterThan(n);
    expect(ss).toBeGreaterThan(s);
    expect(xf).toBeGreaterThan(ss);
  });
});

describe('calcPickTradeValue', () => {
  it('1st round picks are worth more than 7th round', () => {
    const first   = calcPickTradeValue(1, 2024);
    const seventh = calcPickTradeValue(7, 2024);
    expect(first).toBeGreaterThan(seventh);
  });

  it('current-year picks are worth more than future picks', () => {
    const current = calcPickTradeValue(1, 2024); // 2024 <= getCurrentSeason (2024)
    const future  = calcPickTradeValue(1, 2025); // 2025 > getCurrentSeason (2024)
    expect(current).toBeGreaterThan(future);
  });

  it('returns a positive number for all rounds', () => {
    for (let round = 1; round <= 7; round++) {
      expect(calcPickTradeValue(round, 2024)).toBeGreaterThan(0);
    }
  });

  it('round values decrease as round number increases', () => {
    for (let round = 1; round <= 6; round++) {
      expect(calcPickTradeValue(round, 2024)).toBeGreaterThan(calcPickTradeValue(round + 1, 2024));
    }
  });
});
