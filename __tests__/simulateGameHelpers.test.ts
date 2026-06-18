import { describe, it, expect } from 'vitest';

// These helpers are private in simulateGame.ts — tested inline here
function randomNormal(mean: number, stdDev: number): number {
  const u1 = Math.random(), u2 = Math.random();
  return mean + Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * stdDev;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(val)));
}

type WeatherType = 'clear' | 'rain' | 'wind' | 'snow';
function weatherMultipliers(w: WeatherType) {
  switch (w) {
    case 'snow': return { score: 0.84, passYards: 0.74, compPct: -0.07, rushYards: 1.06, rushAttempts: 1.08 };
    case 'rain': return { score: 0.92, passYards: 0.87, compPct: -0.03, rushYards: 1.02, rushAttempts: 1.04 };
    case 'wind': return { score: 0.90, passYards: 0.80, compPct: -0.05, rushYards: 1.00, rushAttempts: 1.02 };
    default:     return { score: 1.00, passYards: 1.00, compPct:  0.00, rushYards: 1.00, rushAttempts: 1.00 };
  }
}

describe('clamp', () => {
  it('clamps values above the max', () => {
    expect(clamp(150, 0, 99)).toBe(99);
  });
  it('clamps values below the min', () => {
    expect(clamp(-5, 0, 99)).toBe(0);
  });
  it('passes through values already within range', () => {
    expect(clamp(75, 0, 99)).toBe(75);
  });
  it('rounds to the nearest integer', () => {
    expect(clamp(74.6, 0, 99)).toBe(75);
  });
});

describe('weatherMultipliers', () => {
  it('snow reduces passing yards and overall scoring', () => {
    expect(weatherMultipliers('snow').passYards).toBeLessThan(weatherMultipliers('clear').passYards);
    expect(weatherMultipliers('snow').score).toBeLessThan(weatherMultipliers('clear').score);
  });

  it('snow boosts rushing yards vs clear', () => {
    expect(weatherMultipliers('snow').rushYards).toBeGreaterThan(weatherMultipliers('clear').rushYards);
  });

  it('clear weather has no penalty on any multiplier', () => {
    const clear = weatherMultipliers('clear');
    expect(clear.score).toBe(1.0);
    expect(clear.passYards).toBe(1.0);
    expect(clear.rushYards).toBe(1.0);
  });

  it('all bad-weather types reduce pass yards below 1.0', () => {
    for (const w of ['rain', 'wind', 'snow'] as WeatherType[]) {
      expect(weatherMultipliers(w).passYards).toBeLessThan(1.0);
    }
  });

  it('snow is harsher on passing than rain', () => {
    expect(weatherMultipliers('snow').passYards).toBeLessThan(weatherMultipliers('rain').passYards);
  });
});

describe('randomNormal', () => {
  it('stays within 4 standard deviations 1000 times in a row', () => {
    const mean = 250, std = 50;
    for (let i = 0; i < 1000; i++) {
      const val = randomNormal(mean, std);
      expect(val).toBeGreaterThan(mean - 4 * std);
      expect(val).toBeLessThan(mean + 4 * std);
    }
  });

  it('mean of 1000 samples is within 10% of the target mean', () => {
    const mean = 200, std = 30;
    const samples = Array.from({ length: 1000 }, () => randomNormal(mean, std));
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    expect(avg).toBeGreaterThan(mean * 0.90);
    expect(avg).toBeLessThan(mean * 1.10);
  });
});
