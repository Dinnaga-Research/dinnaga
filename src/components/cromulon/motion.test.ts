// ABOUTME: Tests for the Cromulon motion gate: when the plasma may flow.
// ABOUTME: It flows for 5 s after activity, always after unlock, never when reduced, hidden or off-screen.
import { describe, expect, it } from 'vitest';
import { SETTLE_MS, shouldAnimate } from './motion';

const base = { now: 1000, lastActive: 1000, visible: true, hidden: false, reduced: false, unlocked: false };

describe('shouldAnimate', () => {
  it('is false under reduced motion', () => {
    expect(shouldAnimate({ ...base, reduced: true })).toBe(false);
    expect(shouldAnimate({ ...base, reduced: true, unlocked: true })).toBe(false);
  });

  it('is false when the tab is hidden', () => {
    expect(shouldAnimate({ ...base, hidden: true })).toBe(false);
    expect(shouldAnimate({ ...base, hidden: true, unlocked: true })).toBe(false);
  });

  it('is false when the art is not visible', () => {
    expect(shouldAnimate({ ...base, visible: false })).toBe(false);
    expect(shouldAnimate({ ...base, visible: false, unlocked: true })).toBe(false);
  });

  it('is false once more than 5 s have passed since activity, without unlock', () => {
    expect(SETTLE_MS).toBe(5000);
    expect(shouldAnimate({ ...base, now: 1000 + SETTLE_MS + 1 })).toBe(false);
  });

  it('is true within 5 s of activity', () => {
    expect(shouldAnimate(base)).toBe(true);
    expect(shouldAnimate({ ...base, now: 1000 + SETTLE_MS })).toBe(true);
  });

  it('is always true after unlock (unless hidden or off-screen)', () => {
    expect(shouldAnimate({ ...base, now: 1000 + 60_000, unlocked: true })).toBe(true);
  });
});
