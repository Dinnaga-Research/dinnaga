// ABOUTME: createScrub and tweenScroll (spec §8.1, §7.6): exponential settle with tau 0.12 s, rAF only while
// ABOUTME: settling; the rail tween eases over its duration and stops on wheel, touch, pointer or key input.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ease } from './ease';
import { createScrub, tweenScroll } from './scrub';

function fakeClock() {
  let t = 0;
  let queue: { id: number; cb: FrameRequestCallback }[] = [];
  let id = 0;
  const raf = vi.fn((cb: FrameRequestCallback) => {
    queue.push({ id: ++id, cb });
    return id;
  });
  const caf = vi.fn((x: number) => void (queue = queue.filter((q) => q.id !== x)));
  const step = (ms = 16) => {
    t += ms;
    const q = queue;
    queue = [];
    q.forEach((f) => f.cb(t));
    return q.length;
  };
  return { raf, caf, now: () => t, step, pending: () => queue.length };
}

describe('createScrub', () => {
  it('does nothing until kicked: no rAF at rest', () => {
    const c = fakeClock();
    createScrub({ read: () => 0.5, apply: () => {}, raf: c.raf, caf: c.caf, now: c.now });
    expect(c.raf).not.toHaveBeenCalled();
  });

  it('moves toward the target by 1 - e^(-dt/tau) per frame', () => {
    const c = fakeClock();
    const seen: number[] = [];
    const s = createScrub({ read: () => 1, apply: (p) => seen.push(p), raf: c.raf, caf: c.caf, now: c.now });
    s.kick();
    c.step(16);
    expect(seen[0]).toBeCloseTo(1 - Math.exp(-0.016 / 0.12), 6);
    c.step(16);
    const p1 = seen[0]!;
    expect(seen[1]).toBeCloseTo(p1 + (1 - p1) * (1 - Math.exp(-0.016 / 0.12)), 6);
  });

  it('settles exactly on the target and stops scheduling frames', () => {
    const c = fakeClock();
    let last = -1;
    const s = createScrub({ read: () => 0.4, apply: (p) => (last = p), raf: c.raf, caf: c.caf, now: c.now });
    s.kick();
    let frames = 0;
    while (c.pending() && frames < 500) {
      c.step(16);
      frames++;
    }
    expect(last).toBe(0.4);
    expect(c.pending()).toBe(0);
    expect(frames).toBeLessThan(150);
    const calls = c.raf.mock.calls.length;
    c.step(16);
    expect(c.raf.mock.calls.length).toBe(calls);
  });

  it('kick while running schedules nothing extra', () => {
    const c = fakeClock();
    const s = createScrub({ read: () => 1, apply: () => {}, raf: c.raf, caf: c.caf, now: c.now });
    s.kick();
    s.kick();
    s.kick();
    expect(c.pending()).toBe(1);
  });

  it('jump applies the target at once; destroy cancels the loop', () => {
    const c = fakeClock();
    const seen: number[] = [];
    const s = createScrub({ read: () => 0.7, apply: (p) => seen.push(p), raf: c.raf, caf: c.caf, now: c.now });
    s.jump();
    expect(seen).toEqual([0.7]);
    expect(s.value()).toBe(0.7);
    s.kick(); // already there: nothing to settle
    expect(c.pending()).toBe(0);
    const s2 = createScrub({ read: () => 1, apply: () => {}, raf: c.raf, caf: c.caf, now: c.now });
    s2.kick();
    s2.destroy();
    expect(c.pending()).toBe(0);
  });

  it('caps a long gap so a background tab does not teleport the frames', () => {
    const c = fakeClock();
    const seen: number[] = [];
    const s = createScrub({ read: () => 1, apply: (p) => seen.push(p), raf: c.raf, caf: c.caf, now: c.now });
    s.kick();
    c.step(5000);
    expect(seen[0]).toBeLessThan(1);
  });
});

describe('tweenScroll', () => {
  afterEach(() => vi.restoreAllMocks());

  it('eases from the current position to y over ms', () => {
    const c = fakeClock();
    const ys: number[] = [];
    let y = 100;
    tweenScroll(1100, 1000, { getY: () => y, scrollTo: (v) => ys.push((y = v)), raf: c.raf, caf: c.caf, now: c.now });
    c.step(500);
    expect(ys[0]).toBeCloseTo(100 + 1000 * ease(0.5), 6);
    c.step(500);
    expect(ys.at(-1)).toBe(1100);
    expect(c.pending()).toBe(0);
  });

  it('is instant when ms is 0 (reduced motion)', () => {
    const c = fakeClock();
    const ys: number[] = [];
    tweenScroll(500, 0, { getY: () => 0, scrollTo: (v) => ys.push(v), raf: c.raf, caf: c.caf, now: c.now });
    expect(ys).toEqual([500]);
    expect(c.pending()).toBe(0);
  });

  it.each(['wheel', 'touchstart', 'pointerdown', 'keydown'])('stops on %s', (type) => {
    const c = fakeClock();
    const ys: number[] = [];
    const target = new EventTarget();
    tweenScroll(1000, 1000, { getY: () => 0, scrollTo: (v) => ys.push(v), raf: c.raf, caf: c.caf, now: c.now, inputTarget: target });
    c.step(100);
    target.dispatchEvent(new Event(type));
    const n = ys.length;
    c.step(100);
    c.step(100);
    expect(ys.length).toBe(n);
    expect(c.pending()).toBe(0);
  });

  it('cancel() stops it and removes the input listeners', () => {
    const c = fakeClock();
    const target = new EventTarget();
    const remove = vi.spyOn(target, 'removeEventListener');
    const t = tweenScroll(1000, 1000, { getY: () => 0, scrollTo: () => {}, raf: c.raf, caf: c.caf, now: c.now, inputTarget: target });
    t.cancel();
    expect(c.pending()).toBe(0);
    expect(remove).toHaveBeenCalledTimes(4);
  });
});
