// ABOUTME: FrameStore and bakeOrder (spec §8.1, §8.4): coarse-to-fine bake order, JPEG blobs, an LRU of at most
// ABOUTME: eight decoded bitmaps that are closed on eviction and dispose, and every object URL revoked.
import { describe, expect, it, vi } from 'vitest';
import { FrameStore, bakeOrder } from './store';

describe('bakeOrder', () => {
  it('is a permutation of 0..179 starting 0, 179', () => {
    const o = bakeOrder(180);
    expect(o.slice(0, 2)).toEqual([0, 179]);
    expect([...o].sort((a, b) => a - b)).toEqual(Array.from({ length: 180 }, (_, i) => i));
  });

  it('goes coarse to fine: every 64th frame before every 32nd, before the odd frames', () => {
    const o = bakeOrder(180);
    expect(o.slice(2, 4)).toEqual([64, 128]);
    const pos = (i: number) => o.indexOf(i);
    expect(pos(32)).toBeLessThan(pos(16));
    expect(pos(16)).toBeLessThan(pos(8));
    expect(Math.max(...[1, 3, 5].map(pos))).toBeGreaterThan(Math.max(...[2, 4, 6].map(pos)));
  });

  it('handles tiny sequences', () => {
    expect(bakeOrder(1)).toEqual([0]);
    expect(bakeOrder(2)).toEqual([0, 1]);
  });
});

const blob = (size: number) => ({ size }) as Blob;
const flush = () => new Promise((r) => setTimeout(r, 0));

function fakes() {
  const bitmaps: { i: number; close: ReturnType<typeof vi.fn> }[] = [];
  let n = 0;
  const createImageBitmap = vi.fn(async () => {
    const b = { i: n++, close: vi.fn(), width: 1, height: 1 };
    bitmaps.push(b);
    return b as unknown as ImageBitmap;
  });
  const urls = new Set<string>();
  const URLfake = {
    createObjectURL: vi.fn(() => {
      const u = `blob:fake/${urls.size}`;
      urls.add(u);
      return u;
    }),
    revokeObjectURL: vi.fn((u: string) => void urls.delete(u)),
  };
  return { bitmaps, createImageBitmap, URL: URLfake, urls };
}

describe('FrameStore', () => {
  it('stores blobs and counts their bytes', () => {
    const f = fakes();
    const s = new FrameStore(180, { createImageBitmap: f.createImageBitmap, URL: f.URL });
    s.put(0, blob(1000));
    s.put(179, blob(500));
    s.put(0, blob(800)); // a re-bake replaces
    expect(s.has(0)).toBe(true);
    expect(s.has(1)).toBe(false);
    expect(s.stats()).toMatchObject({ frames: 180, baked: 2, blobBytes: 1300, decoded: 0 });
    s.dispose();
  });

  it('never holds more than 8 decoded bitmaps and closes what it evicts', async () => {
    const f = fakes();
    const s = new FrameStore(180, { createImageBitmap: f.createImageBitmap, URL: f.URL });
    for (let i = 0; i < 40; i++) s.put(i, blob(10));
    for (let i = 0; i < 40; i++) {
      s.request(i);
      await flush();
      expect(s.stats().decoded).toBeLessThanOrEqual(8);
    }
    expect(s.stats().decoded).toBe(8);
    expect(s.stats().peakDecoded).toBe(8);
    const closed = f.bitmaps.filter((b) => b.close.mock.calls.length > 0);
    expect(closed).toHaveLength(f.bitmaps.length - 8);
    s.dispose();
  });

  it('get returns a decoded frame and keeps it fresh in the LRU', async () => {
    const f = fakes();
    const s = new FrameStore(20, { createImageBitmap: f.createImageBitmap, URL: f.URL });
    for (let i = 0; i < 20; i++) s.put(i, blob(10));
    expect(s.get(0)).toBeNull();
    s.request(0);
    await flush();
    const first = s.get(0);
    expect(first).not.toBeNull();
    for (let i = 1; i < 12; i++) {
      s.request(i);
      await flush();
      s.get(0); // touched every time, so never the least recently used
    }
    expect(s.get(0)).toBe(first);
    s.dispose();
  });

  it('nearest finds a decoded neighbour within the radius', async () => {
    const f = fakes();
    const s = new FrameStore(20, { createImageBitmap: f.createImageBitmap, URL: f.URL });
    for (let i = 0; i < 20; i++) s.put(i, blob(10));
    s.request(10);
    await flush();
    expect(s.nearest(10)).toBe(10);
    expect(s.nearest(12)).toBe(10);
    expect(s.nearest(8)).toBe(10);
    expect(s.nearest(13)).toBe(-1);
    expect(s.nearest(13, 3)).toBe(10);
    s.dispose();
  });

  it('calls onDecoded when a requested frame is ready', async () => {
    const f = fakes();
    const s = new FrameStore(5, { createImageBitmap: f.createImageBitmap, URL: f.URL });
    const seen: number[] = [];
    s.onDecoded = (i) => seen.push(i);
    s.put(3, blob(10));
    s.request(3);
    s.request(4); // no blob yet: ignored
    await flush();
    expect(seen).toEqual([3]);
    s.dispose();
  });

  it('dispose closes every bitmap, including ones that finish decoding later', async () => {
    const f = fakes();
    const s = new FrameStore(10, { createImageBitmap: f.createImageBitmap, URL: f.URL });
    for (let i = 0; i < 10; i++) s.put(i, blob(10));
    for (let i = 0; i < 5; i++) s.request(i);
    await flush();
    s.request(6);
    s.dispose();
    await flush();
    expect(f.bitmaps.length).toBeGreaterThan(0);
    for (const b of f.bitmaps) expect(b.close).toHaveBeenCalledTimes(1);
    expect(s.stats()).toMatchObject({ decoded: 0, baked: 0, blobBytes: 0 });
  });

  it('without createImageBitmap it decodes through object URLs, and dispose revokes every one', async () => {
    const f = fakes();
    const pending: (() => void)[] = [];
    const loadImage = vi.fn((_u: string) => new Promise<CanvasImageSource>((res) => pending.push(() => res({} as CanvasImageSource))));
    const s = new FrameStore(10, { URL: f.URL, loadImage });
    for (let i = 0; i < 4; i++) s.put(i, blob(10));
    s.request(0);
    pending.shift()!();
    await flush();
    expect(f.URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(f.urls.size).toBe(0); // revoked once decoded
    s.request(1);
    s.request(2);
    expect(f.urls.size).toBe(2); // still decoding
    s.dispose();
    expect(f.urls.size).toBe(0);
    expect(f.URL.revokeObjectURL).toHaveBeenCalledTimes(3);
  });

  it('counts live stores, so a remount can be checked for leaks', () => {
    const f = fakes();
    const before = FrameStore.alive;
    const a = new FrameStore(3, { createImageBitmap: f.createImageBitmap, URL: f.URL });
    const b = new FrameStore(3, { createImageBitmap: f.createImageBitmap, URL: f.URL });
    expect(FrameStore.alive).toBe(before + 2);
    a.dispose();
    a.dispose();
    b.dispose();
    expect(FrameStore.alive).toBe(before);
  });
});
