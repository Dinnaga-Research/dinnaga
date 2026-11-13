// ABOUTME: frameLayout (spec §8.1): where the art sits in a frame. Wide and narrow take the art box insets read
// ABOUTME: from the DOM (no hard-coded switcher clearance); still fills the box with C's margin.
import { describe, expect, it } from 'vitest';
import { frameLayout } from './layout';

describe('frameLayout', () => {
  it('wide: the art box is the stage minus the geometry insets', () => {
    const L = frameLayout(1440, 856, 'wide', { left: 432, top: 42, right: 40, bottom: 64 });
    expect(L).toEqual({ W: 1440, H: 856, mode: 'wide', art: { x: 432, y: 42, w: 968, h: 750 } });
  });

  it('narrow: same insets, with C’s 200 px floor on the art height', () => {
    const L = frameLayout(390, 844, 'narrow', { left: 16, top: 70, right: 16, bottom: 168 });
    expect(L.art).toEqual({ x: 16, y: 70, w: 358, h: 606 });
    expect(frameLayout(390, 300, 'narrow', { left: 16, top: 70, right: 16, bottom: 168 }).art.h).toBe(200);
  });

  it('still: C’s margin, max(12, 5% of the short side), geometry ignored', () => {
    const L = frameLayout(600, 372, 'still');
    const m = Math.max(12, 372 * 0.05);
    expect(L.art).toEqual({ x: m, y: m + 4, w: 600 - 2 * m, h: 372 - 2 * m - 4 });
  });

  it('never yields a degenerate box', () => {
    const L = frameLayout(200, 150, 'wide', { left: 300, top: 100, right: 40, bottom: 100 });
    expect(L.art.w).toBeGreaterThan(0);
    expect(L.art.h).toBeGreaterThan(0);
  });
});
