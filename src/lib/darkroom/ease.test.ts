// ABOUTME: The one curve (spec §1 rule 4, §6): cubic-bezier(.19, 1, .22, 1) as a function,
// ABOUTME: checked at its ends and against high-precision reference values.
import { describe, expect, it } from 'vitest';
import { EASE, clamp01, cubicBezier, ease, lerp, seg, smooth } from './ease';

describe('cubicBezier', () => {
  const f = cubicBezier(0.19, 1, 0.22, 1);

  it('hits 0 and 1 at the ends', () => {
    expect(f(0)).toBe(0);
    expect(f(1)).toBe(1);
    expect(f(-0.5)).toBe(0);
    expect(f(1.5)).toBe(1);
  });

  it('matches reference values at 0.25, 0.5 and 0.75 to 1e-4', () => {
    // Bisection to 200 iterations on the parametric curve.
    expect(Math.abs(f(0.25) - 0.84351432)).toBeLessThan(1e-4);
    expect(Math.abs(f(0.5) - 0.97782459)).toBeLessThan(1e-4);
    expect(Math.abs(f(0.75) - 0.99827135)).toBeLessThan(1e-4);
  });

  it('is the identity for the linear control points', () => {
    const lin = cubicBezier(0.25, 0.25, 0.75, 0.75);
    for (const x of [0.1, 0.33, 0.9]) expect(Math.abs(lin(x) - x)).toBeLessThan(1e-4);
  });

  it('is monotonic', () => {
    let last = 0;
    for (let i = 1; i <= 200; i++) {
      const v = f(i / 200);
      expect(v).toBeGreaterThanOrEqual(last);
      last = v;
    }
  });
});

describe('EASE and ease', () => {
  it('EASE carries the CSS numbers', () => {
    expect(EASE).toEqual([0.19, 1, 0.22, 1]);
  });

  it('ease is the signature curve', () => {
    expect(Math.abs(ease(0.5) - 0.97782459)).toBeLessThan(1e-4);
  });
});

describe('helpers', () => {
  it('clamp01, seg, lerp and smooth', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(0.4)).toBe(0.4);
    expect(seg(0.5, 0.4, 0.6)).toBeCloseTo(0.5);
    expect(seg(0.1, 0.4, 0.6)).toBe(0);
    expect(seg(0.9, 0.4, 0.6)).toBe(1);
    expect(lerp(10, 20, 0.25)).toBe(12.5);
    expect(smooth(0)).toBe(0);
    expect(smooth(1)).toBe(1);
    expect(smooth(0.5)).toBe(0.5);
  });
});
