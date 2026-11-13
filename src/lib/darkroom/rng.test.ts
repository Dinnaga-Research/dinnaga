// ABOUTME: mulberry32 is the seeded generator behind every frame: same seed, same sequence.
import { describe, expect, it } from 'vitest';
import { mulberry32 } from './rng';

describe('mulberry32', () => {
  it('is deterministic for a seed', () => {
    const a = mulberry32(7193);
    const b = mulberry32(7193);
    const xs = Array.from({ length: 50 }, () => a());
    const ys = Array.from({ length: 50 }, () => b());
    expect(xs).toEqual(ys);
  });

  it('differs between seeds', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });

  it('returns values in [0, 1)', () => {
    const r = mulberry32(99);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('matches the reference mulberry32 output', () => {
    // First values of the canonical mulberry32 for seed 1.
    const r = mulberry32(1);
    expect(r()).toBeCloseTo(0.6270739405881613, 12);
    expect(r()).toBeCloseTo(0.002735721180215478, 12);
  });
});
