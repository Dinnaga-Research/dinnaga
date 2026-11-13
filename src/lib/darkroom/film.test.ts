// ABOUTME: makeFilm (spec §8.1): one grain tile and one vignette per frame size, made with an injected canvas
// ABOUTME: factory; the grain clumps at about 1.4 device pixels whatever the scale.
import { describe, expect, it } from 'vitest';
import { makeFilm } from './film';
import { frameLayout } from './layout';
import { buildScene } from './scene';

function fakeCanvasFactory() {
  const made: { width: number; height: number; puts: number; fills: number }[] = [];
  const factory = (w: number, h: number) => {
    const rec = { width: w, height: h, puts: 0, fills: 0 };
    made.push(rec);
    const ctx = {
      createImageData: (iw: number, ih: number) => ({ data: new Uint8ClampedArray(iw * ih * 4), width: iw, height: ih }),
      putImageData: () => void rec.puts++,
      createRadialGradient: () => ({ addColorStop: () => {} }),
      fillRect: () => void rec.fills++,
      set fillStyle(_v: unknown) {},
    };
    return { width: w, height: h, getContext: () => ctx } as unknown as HTMLCanvasElement;
  };
  return { factory, made };
}

describe('makeFilm', () => {
  const scene = buildScene(frameLayout(1440, 844, 'wide', { left: 432, top: 42, right: 40, bottom: 64 }));

  it('makes a 160 px grain tile and a vignette with the frame’s aspect', () => {
    const { factory, made } = fakeCanvasFactory();
    const film = makeFilm(scene, 1.15, factory);
    expect(made[0]).toMatchObject({ width: 160, height: 160, puts: 1 });
    expect(made[1]!.width).toBe(256);
    expect(made[1]!.height).toBe(Math.max(64, Math.round(256 * (844 / 1440))));
    expect(made[1]!.fills).toBe(1);
    expect(film.grainCss).toBeCloseTo((160 / 1.15) * 1.4);
  });

  it('grain clumps scale with the pixel scale', () => {
    const { factory } = fakeCanvasFactory();
    expect(makeFilm(scene, 1.5, factory).grainCss).toBeCloseTo((160 / 1.5) * 1.4);
  });
});
