// ABOUTME: mountSequence (spec §8.1) in jsdom with stubbed canvas, observers and fonts: it sizes the plate,
// ABOUTME: bakes into the store, reports stages, freezes the h1's lines, and destroy() releases everything.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FrameStore } from './store';
import { mountSequence, type SequenceHandle } from './sequence';
import { recordingContext } from './testing';

let roCallbacks: ResizeObserverCallback[] = [];
let ioCallbacks: IntersectionObserverCallback[] = [];
const disconnects = vi.fn();

function stubBrowser() {
  roCallbacks = [];
  ioCallbacks = [];
  disconnects.mockClear();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(cb: ResizeObserverCallback) {
        roCallbacks.push(cb);
      }
      observe() {}
      disconnect = disconnects;
    },
  );
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: IntersectionObserverCallback) {
        ioCallbacks.push(cb);
      }
      observe() {}
      disconnect = disconnects;
    },
  );
  vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ close: vi.fn(), width: 1, height: 1 })));
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () => recordingContext().ctx as unknown as ReturnType<HTMLCanvasElement['getContext']>,
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (cb: BlobCallback) {
    setTimeout(() => cb(new Blob([new Uint8Array(100)])), 0);
  });
  Object.defineProperty(document, 'fonts', { configurable: true, value: { ready: Promise.resolve() } });
}

function build() {
  const run = document.createElement('section');
  const stage = document.createElement('div');
  const plate = document.createElement('canvas');
  const art = document.createElement('div');
  const hero = document.createElement('div');
  const h1 = document.createElement('h1');
  h1.textContent = 'Living documents for engineers who code with AI';
  hero.append(h1);
  const counter = document.createElement('p');
  const stamp = document.createElement('div');
  const labels = [0, 1, 2, 3].map(() => document.createElement('span'));
  stage.append(plate, art, hero, counter, stamp, ...labels);
  run.append(stage);
  document.body.append(run);
  const size = (el: HTMLElement, w: number, h: number, top = 0, left = 0) => {
    Object.defineProperty(el, 'clientWidth', { configurable: true, value: w });
    Object.defineProperty(el, 'clientHeight', { configurable: true, value: h });
    Object.defineProperty(el, 'offsetHeight', { configurable: true, value: h });
    el.getBoundingClientRect = () => ({ top, left, width: w, height: h, right: left + w, bottom: top + h, x: left, y: top, toJSON() {} });
  };
  size(run, 1440, 900 * 6);
  size(stage, 1440, 844, 0, 0);
  size(art, 968, 750, 42, 432);
  return { run, stage, plate, art, hero, h1, counter, stamp, labels };
}

const settle = async (ms = 50) => {
  await vi.advanceTimersByTimeAsync(ms);
};

describe('mountSequence', () => {
  let handle: SequenceHandle | null = null;
  beforeEach(() => {
    vi.useFakeTimers();
    stubBrowser();
  });
  afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sizes the plate from the stage and the pixel scale, and reads the art box from the DOM', async () => {
    const els = build();
    handle = mountSequence({ ...els, frames: 12, dpr: 2 });
    roCallbacks[0]!([], {} as ResizeObserver);
    await settle();
    expect(els.plate.width).toBe(Math.round(1440 * 1.15));
    expect(els.plate.height).toBe(Math.round(844 * 1.15));
    expect(els.plate.style.width).toBe('1440px');
    const s = handle.stats();
    expect(s.mode).toBe('wide');
    expect(s.art).toEqual({ x: 432, y: 42, w: 968, h: 750 });
  });

  it('bakes every frame into one store and draws the first frame', async () => {
    const els = build();
    handle = mountSequence({ ...els, frames: 12, dpr: 1 });
    roCallbacks[0]!([], {} as ResizeObserver);
    await settle(500);
    const s = handle.stats();
    expect(s.baked).toBe(12);
    expect(s.stores).toBe(1);
    expect(s.firstFrameMs).not.toBeNull();
    expect(s.paints).toBeGreaterThanOrEqual(12);
    expect(els.counter.textContent).toBe('Frame 001 / 12');
  });

  it('pauses baking while the document is hidden', async () => {
    const els = build();
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    handle = mountSequence({ ...els, frames: 12, dpr: 1 });
    roCallbacks[0]!([], {} as ResizeObserver);
    await settle(500);
    expect(handle.stats().baked).toBe(0);
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
    await settle(500);
    expect(handle.stats().baked).toBe(12);
  });

  it('freezes the h1 into lines and restores it on destroy', async () => {
    const els = build();
    handle = mountSequence({ ...els, frames: 4, dpr: 1 });
    roCallbacks[0]!([], {} as ResizeObserver);
    await settle();
    expect(els.h1.querySelectorAll('.ln').length).toBeGreaterThan(0);
    expect(els.h1.textContent!.replace(/\s+/g, ' ')).toBe('Living documents for engineers who code with AI');
    handle.destroy();
    handle = null;
    expect(els.h1.children).toHaveLength(0);
    expect(els.h1.textContent).toBe('Living documents for engineers who code with AI');
  });

  it('reports the stage on scroll and writes progress to the stage', async () => {
    const els = build();
    const stages: number[] = [];
    handle = mountSequence({ ...els, frames: 12, dpr: 1, onStage: (k) => stages.push(k) });
    roCallbacks[0]!([], {} as ResizeObserver);
    await settle();
    expect(stages).toEqual([-1]);
    handle.setProgress(0.41);
    expect(stages).toEqual([-1, 2]);
    expect(els.stage.style.getPropertyValue('--dn-run-p')).toBe('0.4100');
    expect(els.stage.style.getPropertyValue('--dn-rail-a')).toBe('1');
  });

  it('destroy() releases the store, observers, listeners and timers', async () => {
    const els = build();
    const before = FrameStore.alive;
    const added = vi.spyOn(window, 'addEventListener');
    handle = mountSequence({ ...els, frames: 12, dpr: 1 });
    roCallbacks[0]!([], {} as ResizeObserver);
    await settle(30);
    expect(FrameStore.alive).toBe(before + 1);
    handle.destroy();
    handle = null;
    expect(FrameStore.alive).toBe(before);
    expect(disconnects).toHaveBeenCalledTimes(2);
    // Window listeners are bound to an AbortSignal that destroy() aborts.
    const windowListeners = added.mock.calls.filter((c) => c[0] === 'scroll' || c[0] === 'resize');
    expect(windowListeners.map((c) => c[0]).sort()).toEqual(['resize', 'scroll']);
    for (const c of windowListeners) expect((c[2] as AddEventListenerOptions).signal?.aborted).toBe(true);
    const toBlobCalls = vi.mocked(HTMLCanvasElement.prototype.toBlob).mock.calls.length;
    await settle(500);
    expect(vi.mocked(HTMLCanvasElement.prototype.toBlob).mock.calls.length).toBe(toBlobCalls);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('a width change rebuilds after 220 ms with a fresh store; a small height change is ignored', async () => {
    const els = build();
    handle = mountSequence({ ...els, frames: 6, dpr: 1 });
    roCallbacks[0]!([], {} as ResizeObserver);
    await settle(200);
    const setups = handle.stats().setups;
    Object.defineProperty(els.stage, 'clientHeight', { configurable: true, value: 760 });
    roCallbacks[0]!([], {} as ResizeObserver);
    await settle(300);
    expect(handle.stats().setups).toBe(setups);
    Object.defineProperty(els.stage, 'clientWidth', { configurable: true, value: 1200 });
    roCallbacks[0]!([], {} as ResizeObserver);
    await settle(100);
    expect(handle.stats().setups).toBe(setups);
    await settle(200);
    expect(handle.stats().setups).toBe(setups + 1);
    expect(handle.stats().stores).toBe(1);
  });
});
