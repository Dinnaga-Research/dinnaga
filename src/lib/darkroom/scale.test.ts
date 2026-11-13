// ABOUTME: pixelScale (spec §8.1, §8.4): the DPR budget, a 1920x1200 pixel ceiling per canvas and a 0.5 floor.
import { describe, expect, it } from 'vitest';
import { MAX_CANVAS_PIXELS, pixelScale } from './scale';

const formula = (w: number, h: number, dpr: number) => {
  const s = dpr <= 2 ? Math.min(dpr, 1.15) : Math.min(dpr, 1.5);
  return Math.max(0.5, Math.min(s, Math.sqrt((1920 * 1200) / (w * h))));
};

describe('pixelScale', () => {
  it('caps the DPR: 1 stays 1, 2 becomes 1.15, 3 becomes 1.5', () => {
    expect(pixelScale(390, 844, 1)).toBe(1);
    expect(pixelScale(390, 844, 2)).toBe(1.15);
    expect(pixelScale(390, 844, 3)).toBe(1.5);
  });

  it('matches the formula across sizes and ratios', () => {
    for (const [w, h] of [[1440, 900], [390, 844], [600, 372], [1920, 1080], [2560, 1440], [320, 640]] as const) {
      for (const dpr of [1, 1.5, 2, 2.5, 3]) expect(pixelScale(w, h, dpr)).toBeCloseTo(formula(w, h, dpr), 12);
    }
  });

  it('applies the ceiling at 2560x1440', () => {
    const s = pixelScale(2560, 1440, 2);
    expect(s).toBeCloseTo(Math.sqrt((1920 * 1200) / (2560 * 1440)), 12);
    expect(Math.round(2560 * s) * Math.round(1440 * s)).toBeLessThanOrEqual(MAX_CANVAS_PIXELS + 2560);
  });

  it('never makes a canvas over 1920x1200 pixels', () => {
    for (const [w, h] of [[1440, 900], [1920, 1200], [2560, 1440], [3840, 2160], [390, 844]] as const) {
      for (const dpr of [1, 2, 3]) {
        const s = pixelScale(w, h, dpr);
        if (s > 0.5) expect(w * s * h * s).toBeLessThanOrEqual(MAX_CANVAS_PIXELS + 1e-6);
      }
    }
  });

  it('floors at 0.5', () => {
    expect(pixelScale(8000, 6000, 1)).toBe(0.5);
  });

  it('treats a missing or zero DPR as 1', () => {
    expect(pixelScale(390, 844, 0)).toBe(1);
  });
});
