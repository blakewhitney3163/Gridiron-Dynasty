import { describe, it, expect } from 'vitest';

// ── Inline the progression table from SeasonService.ts ───────────────────────

type AgeBracket = 'young' | 'rising' | 'prime' | 'decline' | 'old' | 'veteran';
type DevTrait = 'Normal' | 'Star' | 'Superstar' | 'X-Factor';

const progressionTable: Record<AgeBracket, Record<DevTrait, [number, number]>> = {
  young:   { Normal: [0, 1],  Star: [1, 2],  Superstar: [2, 3],  'X-Factor': [3, 4]  },
  rising:  { Normal: [0, 1],  Star: [0, 2],  Superstar: [1, 2],  'X-Factor': [2, 3]  },
  prime:   { Normal: [-1, 0], Star: [0, 1],  Superstar: [0, 1],  'X-Factor': [0, 1]  },
  decline: { Normal: [-2,-1], Star: [-1, 0], Superstar: [-1, 0], 'X-Factor': [-1, 0] },
  old:     { Normal: [-3,-2], Star: [-2,-1], Superstar: [-2,-1], 'X-Factor': [-1, 0] },
  veteran: { Normal: [-4,-3], Star: [-3,-2], Superstar: [-3,-2], 'X-Factor': [-2,-1] },
};

function getBracket(age: number): AgeBracket {
  if (age <= 23) return 'young';
  if (age <= 26) return 'rising';
  if (age <= 29) return 'prime';
  if (age <= 32) return 'decline';
  if (age <= 35) return 'old';
  return 'veteran';
}

function getRetirementChance(age: number, ovr: number): number {
  if (age < 33) return 0;
  let chance = age >= 40 ? 0.95 : age >= 38 ? 0.75 : age >= 36 ? 0.40 : age >= 34 ? 0.18 : 0.07;
  if (ovr < 72) chance = Math.min(0.95, chance * 1.5);
  return chance;
}

// Inline HOF thresholds from constants (representative subset for testing)
function isHOFEligible(position: string, career: Record<string, number>): boolean {
  if ((career.games ?? 0) < 80) return false;
  const thresholds: Record<string, Array<{ stat: string; value: number }>> = {
    QB:  [{ stat: 'pass_yards', value: 30000 }, { stat: 'pass_tds', value: 200 }],
    RB:  [{ stat: 'rush_yards', value: 8000  }, { stat: 'rush_tds', value: 60  }],
    WR:  [{ stat: 'rec_yards',  value: 8000  }, { stat: 'receptions', value: 600 }],
    LB:  [{ stat: 'tackles',    value: 800   }, { stat: 'sacks', value: 80 }],
  };
  const t = thresholds[position];
  if (!t) return false;
  return t.some(th => (career[th.stat] ?? 0) >= th.value);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('getBracket', () => {
  it('maps age boundaries correctly', () => {
    expect(getBracket(22)).toBe('young');
    expect(getBracket(23)).toBe('young');
    expect(getBracket(24)).toBe('rising');
    expect(getBracket(26)).toBe('rising');
    expect(getBracket(27)).toBe('prime');
    expect(getBracket(29)).toBe('prime');
    expect(getBracket(30)).toBe('decline');
    expect(getBracket(32)).toBe('decline');
    expect(getBracket(33)).toBe('old');
    expect(getBracket(35)).toBe('old');
    expect(getBracket(36)).toBe('veteran');
    expect(getBracket(42)).toBe('veteran');
  });
});

describe('progressionTable', () => {
  it('young X-Factor players always have a positive range', () => {
    const [min, max] = progressionTable.young['X-Factor'];
    expect(min).toBeGreaterThan(0);
    expect(max).toBeGreaterThan(0);
  });

  it('veteran Normal players always have a negative range', () => {
    const [min, max] = progressionTable.veteran.Normal;
    expect(max).toBeLessThan(0);
    expect(min).toBeLessThan(max);
  });

  it('better dev traits always have higher or equal ceiling in every bracket', () => {
    for (const bracket of Object.keys(progressionTable) as AgeBracket[]) {
      const [, normalMax]    = progressionTable[bracket].Normal;
      const [, starMax]      = progressionTable[bracket].Star;
      const [, superstarMax] = progressionTable[bracket].Superstar;
      const [, xfMax]        = progressionTable[bracket]['X-Factor'];
      expect(starMax).toBeGreaterThanOrEqual(normalMax);
      expect(superstarMax).toBeGreaterThanOrEqual(starMax);
      expect(xfMax).toBeGreaterThanOrEqual(superstarMax);
    }
  });

  it('min is always ≤ max in every cell', () => {
    for (const bracket of Object.keys(progressionTable) as AgeBracket[]) {
      for (const trait of ['Normal','Star','Superstar','X-Factor'] as DevTrait[]) {
        const [min, max] = progressionTable[bracket][trait];
        expect(min).toBeLessThanOrEqual(max);
      }
    }
  });

  it('prime bracket: Normal players trend flat or slightly negative', () => {
    const [min, max] = progressionTable.prime.Normal;
    expect(max).toBeLessThanOrEqual(0);
  });
});

describe('retirement probability', () => {
  it('players under 33 have 0% retirement chance', () => {
    expect(getRetirementChance(32, 80)).toBe(0);
    expect(getRetirementChance(25, 70)).toBe(0);
  });

  it('retirement chance increases monotonically with age', () => {
    const ages = [33, 34, 35, 36, 37, 38, 39, 40];
    const chances = ages.map(a => getRetirementChance(a, 80));
    for (let i = 1; i < chances.length; i++) {
      expect(chances[i]).toBeGreaterThanOrEqual(chances[i - 1]);
    }
  });

  it('age 40+ always has >= 95% retirement chance', () => {
    expect(getRetirementChance(40, 80)).toBeGreaterThanOrEqual(0.95);
    expect(getRetirementChance(45, 80)).toBeGreaterThanOrEqual(0.95);
  });

  it('low-OVR players retire at a higher rate than high-OVR at the same age', () => {
    const lowOvr  = getRetirementChance(35, 65);
    const highOvr = getRetirementChance(35, 85);
    expect(lowOvr).toBeGreaterThan(highOvr);
  });

  it('chance is always capped at 1.0 (100%)', () => {
    expect(getRetirementChance(45, 60)).toBeLessThanOrEqual(1.0);
  });
});

describe('HOF eligibility', () => {
  it('QB with 30k+ pass yards and 80+ games is eligible', () => {
    expect(isHOFEligible('QB', { games: 180, pass_yards: 35000, pass_tds: 220 })).toBe(true);
  });

  it('QB under the 80-game minimum is not eligible regardless of stats', () => {
    expect(isHOFEligible('QB', { games: 40, pass_yards: 50000, pass_tds: 400 })).toBe(false);
  });

  it('QB with good games but below stat threshold is not eligible', () => {
    expect(isHOFEligible('QB', { games: 120, pass_yards: 10000, pass_tds: 50 })).toBe(false);
  });

  it('RB with 8000+ rush yards and 80+ games is eligible', () => {
    expect(isHOFEligible('RB', { games: 150, rush_yards: 9000, rush_tds: 75 })).toBe(true);
  });

  it('unknown position is never eligible', () => {
    expect(isHOFEligible('P', { games: 200, pass_yards: 99999 })).toBe(false);
  });

  it('meeting ANY threshold (yards OR TDs) is enough', () => {
    // QB with enough TDs but not yards
    expect(isHOFEligible('QB', { games: 160, pass_yards: 15000, pass_tds: 250 })).toBe(true);
  });
});
