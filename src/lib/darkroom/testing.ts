// ABOUTME: Test helpers for the engine (imported by *.test.ts only): a recording fake 2D context and fake film.
// ABOUTME: The recorder keeps every fill/stroke colour and counts each call, so tests can audit a paint.
import type { Film } from './film';

export interface Recorder {
  ctx: CanvasRenderingContext2D;
  colours: Set<string>;
  calls: Record<string, number>;
  log: string[];
}

export function recordingContext(): Recorder {
  const colours = new Set<string>();
  const calls: Record<string, number> = {};
  const log: string[] = [];
  const state: Record<string, unknown> = { globalAlpha: 1, fillStyle: '#000', strokeStyle: '#000', lineWidth: 1 };
  const ctx = new Proxy(
    {},
    {
      get(_t, prop: string) {
        if (prop in state) return state[prop];
        return (...args: unknown[]) => {
          calls[prop] = (calls[prop] ?? 0) + 1;
          log.push(`${prop}(${args.map((a) => (typeof a === 'number' ? a.toFixed(3) : typeof a)).join(',')})`);
          if (prop === 'createImageData') {
            const [w, h] = args as [number, number];
            return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
          }
          if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return { addColorStop() {} };
          return undefined;
        };
      },
      set(_t, prop: string, value) {
        state[prop] = value;
        if (prop === 'fillStyle' || prop === 'strokeStyle') colours.add(String(value));
        log.push(`${prop}=${typeof value === 'number' ? value.toFixed(3) : String(value)}`);
        return true;
      },
    },
  ) as unknown as CanvasRenderingContext2D;
  return { ctx, colours, calls, log };
}

export const fakeFilm = (): Film => ({ grain: {} as CanvasImageSource, grainCss: 120, vig: {} as CanvasImageSource });
