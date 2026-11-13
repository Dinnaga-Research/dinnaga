// ABOUTME: FrameStill (spec §8.2): one labelled canvas (role img) painted once when within a viewport, repainted
// ABOUTME: on a width change over 2 px; the painter is loaded lazily; the Ship still can carry the stamp.
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FrameStill } from './FrameStill';
import { setWidth, stubObservers } from './testing';

const paint = vi.hoisted(() => ({
  paintStill: vi.fn(() => ({ scene: { stamp: { cx: 300, cy: 400, d: 100 } }, scale: 1 })),
}));
vi.mock('../../lib/darkroom/paint', () => paint);

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('FrameStill', () => {
  let obs: ReturnType<typeof stubObservers>;
  beforeEach(() => {
    obs = stubObservers();
    paint.paintStill.mockClear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('is a canvas with role img and the given label', () => {
    render(<FrameStill p={0.2} index={0} label="Still frame for stage 1, Read" aspect="auto" />);
    expect(screen.getByRole('img', { name: 'Still frame for stage 1, Read' }).tagName).toBe('CANVAS');
  });

  it('paints only once near the viewport, with its moment and index', async () => {
    const { container } = render(<FrameStill p={0.34} index={1} label="x" aspect="auto" />);
    const box = container.querySelector('.still__box')!;
    setWidth(box, 600);
    await flush();
    expect(paint.paintStill).not.toHaveBeenCalled();
    obs.intersect(box);
    await flush();
    expect(paint.paintStill).toHaveBeenCalledTimes(1);
    const [canvas, w, h, p, index] = paint.paintStill.mock.calls[0] as unknown as [HTMLCanvasElement, number, number, number, number];
    expect(canvas.tagName).toBe('CANVAS');
    expect([w, h, p, index]).toEqual([600, Math.round(600 * 0.62), 0.34, 1]);
    expect(obs.io[0]!.disconnected).toBe(true); // painted once: no longer watching
  });

  it('uses C’s aspect: auto is 0.62 above 560 px wide and 1.2 below; wide and tall are fixed', async () => {
    const cases = [
      ['auto', 400, 480],
      ['wide', 400, Math.round(400 * 0.62)],
      ['tall', 800, 960],
    ] as const;
    for (const [aspect, w, h] of cases) {
      paint.paintStill.mockClear();
      const { container, unmount } = render(<FrameStill p={0.2} index={0} label="x" aspect={aspect} />);
      const box = container.querySelector('.still__box')!;
      setWidth(box, w);
      obs.intersect(box);
      await flush();
      expect(paint.paintStill.mock.calls[0]!.slice(1, 3)).toEqual([w, h]);
      unmount();
    }
  });

  it('repaints on a width change over 2 px, not under', async () => {
    const { container } = render(<FrameStill p={0.2} index={0} label="x" aspect="auto" />);
    const box = container.querySelector('.still__box')!;
    setWidth(box, 600);
    obs.intersect(box);
    await flush();
    setWidth(box, 602);
    obs.resize(box);
    await flush();
    expect(paint.paintStill).toHaveBeenCalledTimes(1);
    setWidth(box, 640);
    obs.resize(box);
    await flush();
    expect(paint.paintStill).toHaveBeenCalledTimes(2);
  });

  it('places the stamp on the sheet when asked', async () => {
    const { container } = render(<FrameStill p={1} index={4} label="x" aspect="auto" stamp />);
    const box = container.querySelector('.still__box')!;
    setWidth(box, 600);
    obs.intersect(box);
    await flush();
    const stamp = container.querySelector<SVGElement>('svg.stamp')!;
    expect(stamp).not.toBeNull();
    expect(stamp.style.left).toBe('250px');
    expect(stamp.style.top).toBe('350px');
    expect(stamp.style.width).toBe('100px');
  });

  it('has no stamp by default', () => {
    const { container } = render(<FrameStill p={0.2} index={0} label="x" aspect="auto" />);
    expect(container.querySelector('.stamp')).toBeNull();
  });
});
