// ABOUTME: Test helpers for the darkroom components (imported by *.test.tsx only): stub observers that tests
// ABOUTME: trigger by hand, and a matchMedia whose motion preference a test can set.
import { vi } from 'vitest';

export interface Observed {
  cb: (entries: unknown[]) => void;
  targets: Element[];
  disconnected: boolean;
}

export function stubObservers() {
  const io: Observed[] = [];
  const ro: Observed[] = [];
  const make = (list: Observed[]) =>
    class {
      rec: Observed;
      constructor(cb: (entries: unknown[]) => void) {
        this.rec = { cb, targets: [], disconnected: false };
        list.push(this.rec);
      }
      observe(t: Element) {
        this.rec.targets.push(t);
      }
      unobserve() {}
      disconnect() {
        this.rec.disconnected = true;
      }
    };
  vi.stubGlobal('IntersectionObserver', make(io));
  vi.stubGlobal('ResizeObserver', make(ro));
  return {
    io,
    ro,
    intersect(el: Element, isIntersecting = true) {
      for (const o of io) if (o.targets.includes(el) && !o.disconnected) o.cb([{ target: el, isIntersecting }]);
    },
    resize(el: Element) {
      for (const o of ro) if (o.targets.includes(el) && !o.disconnected) o.cb([{ target: el }]);
    },
  };
}

export function stubMotion(noPreference: boolean) {
  const listeners = new Set<() => void>();
  const mql = {
    get matches() {
      return noPreference;
    },
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
  };
  vi.stubGlobal('matchMedia', vi.fn(() => mql));
  return {
    set(v: boolean) {
      noPreference = v;
      listeners.forEach((cb) => cb());
    },
  };
}

export function setWidth(el: Element, w: number) {
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: w });
}
