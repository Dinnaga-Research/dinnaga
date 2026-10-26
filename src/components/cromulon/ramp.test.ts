// ABOUTME: Tests for the Cromulon shade ramp: the pure shade-to-character mapping and the plasma wobble.
// ABOUTME: The ramp is the classic ten-step ' .:-=+*#%@'.
import { describe, expect, it } from 'vitest';
import { RAMP, plasma, rampChar } from './ramp';

describe('rampChar', () => {
  it('maps shade 0 to a space and shade 1 to @', () => {
    expect(rampChar(0)).toBe(' ');
    expect(rampChar(1)).toBe('@');
  });

  it('is monotonic across 0..1', () => {
    let last = 0;
    for (let i = 0; i <= 100; i++) {
      const idx = RAMP.indexOf(rampChar(i / 100));
      expect(idx).toBeGreaterThanOrEqual(last);
      last = idx;
    }
  });

  it('clamps out-of-range shades', () => {
    expect(rampChar(-3)).toBe(' ');
    expect(rampChar(7)).toBe('@');
  });
});

describe('plasma', () => {
  it('stays within -1..1', () => {
    for (let x = 0; x < 80; x += 7) for (let y = 0; y < 60; y += 5) {
      const v = plasma(x, y, 1.3);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});
