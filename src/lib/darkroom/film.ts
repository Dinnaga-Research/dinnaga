// ABOUTME: makeFilm (spec §8.1): the grain tile and the vignette baked into every frame, made once per frame
// ABOUTME: size. The canvas factory is injectable so tests can run without a real 2D context.
import { mulberry32 } from './rng';
import type { Scene } from './scene';

export interface Film {
  grain: CanvasImageSource | null;
  /** Grain tile size in CSS px: about 1.4 device pixels per grain clump. */
  grainCss: number;
  vig: CanvasImageSource | null;
}

export type CanvasFactory = (w: number, h: number) => HTMLCanvasElement | OffscreenCanvas;

export const domCanvas: CanvasFactory = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

const GRAIN = 160;

export function makeFilm(scene: Scene, scale: number, createCanvas: CanvasFactory = domCanvas): Film {
  const g = createCanvas(GRAIN, GRAIN);
  const gx = g.getContext('2d') as CanvasRenderingContext2D | null;
  let grain: CanvasImageSource | null = null;
  if (gx) {
    const id = gx.createImageData(GRAIN, GRAIN);
    const R = mulberry32(99);
    for (let i = 0; i < id.data.length; i += 4) {
      const light = R() < 0.5;
      const a = R();
      id.data[i] = id.data[i + 1] = id.data[i + 2] = light ? 255 : 0;
      id.data[i + 3] = light ? a * a * 30 : a * 46;
    }
    gx.putImageData(id, 0, 0);
    grain = g as CanvasImageSource;
  }

  const { W, H } = scene.layout;
  const vw = 256;
  const vh = Math.max(64, Math.round(256 * (H / W)));
  const v = createCanvas(vw, vh);
  const vx = v.getContext('2d') as CanvasRenderingContext2D | null;
  let vig: CanvasImageSource | null = null;
  if (vx) {
    const gr = vx.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.3, vw / 2, vh / 2, Math.hypot(vw, vh) * 0.56);
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(1, 'rgba(0,0,0,0.42)');
    vx.fillStyle = gr;
    vx.fillRect(0, 0, vw, vh);
    vig = v as CanvasImageSource;
  }
  return { grain, grainCss: (GRAIN / scale) * 1.4, vig };
}
