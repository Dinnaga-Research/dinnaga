// ABOUTME: Frame data support for the Cromulon: source selection, hex decoding and fitting a grid into the cells.
// ABOUTME: The generated cromulon-frame.ts module is optional and read only through import.meta.glob.
/// <reference types="vite/client" />
import { Mat, type Cell } from './cell';
import { sceneCell } from './scene';

export interface FrameData {
  version: 1;
  width: number;
  height: number;
  /** One hex digit (a 0..15 level) per pixel, row by row. */
  open: string;
  closed?: string;
}

type FrameModule = { CROMULON_FRAME: FrameData };
type FrameLoader = () => Promise<FrameModule>;

export type Source = { kind: 'sdf' } | { kind: 'frame'; load: FrameLoader };

/** The SDF head when the glob result is empty, otherwise the frame loader. */
export function selectSource(globResult: Record<string, FrameLoader>): Source {
  const load = Object.values(globResult)[0];
  return load ? { kind: 'frame', load } : { kind: 'sdf' };
}

/** `{}` when the generated module is absent, so a missing file is not an error. */
export const source: Source = selectSource(import.meta.glob<FrameModule>('./cromulon-frame.ts'));

/** Decode a string of hex digits into 0..15 levels. */
export function decodeHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length);
  for (let i = 0; i < hex.length; i++) out[i] = parseInt(hex[i]!, 16);
  return out;
}

/**
 * Fit a level grid into the lower-right 0.78 x 0.70 box of a cols x rows cell grid,
 * one cell in from the bottom-right corner, area-averaging the pixels per cell.
 * `cellAspect` is cell height / cell width.
 */
export function fitFrame(
  levels: Uint8Array,
  width: number,
  height: number,
  cols: number,
  rows: number,
  cellAspect: number,
): Cell[] {
  const out: Cell[] = Array.from({ length: cols * rows }, () => ({ shade: 0, mat: Mat.None }));
  if (width <= 0 || height <= 0) return out;
  const boxW = cols * 0.78;
  const boxH = rows * 0.7;
  const imgAspect = height / width;
  let w = boxW;
  let h = (boxW * imgAspect) / cellAspect;
  if (h > boxH) {
    h = boxH;
    w = (boxH * cellAspect) / imgAspect;
  }
  w = Math.round(w);
  h = Math.round(h);
  if (w <= 0 || h <= 0) return out;
  const ox = cols - w - 1;
  const oy = rows - h - 1;
  for (let r = 0; r < h; r++) {
    const y0 = (r * height) / h;
    const y1 = ((r + 1) * height) / h;
    for (let c = 0; c < w; c++) {
      const x0 = (c * width) / w;
      const x1 = ((c + 1) * width) / w;
      let sum = 0;
      let weight = 0;
      for (let y = Math.floor(y0); y < Math.min(height, Math.ceil(y1)); y++) {
        const wy = Math.min(y + 1, y1) - Math.max(y, y0);
        for (let x = Math.floor(x0); x < Math.min(width, Math.ceil(x1)); x++) {
          const wx = Math.min(x + 1, x1) - Math.max(x, x0);
          sum += (levels[y * width + x] ?? 0) * wx * wy;
          weight += wx * wy;
        }
      }
      const avg = weight > 0 ? sum / weight : 0;
      const y = oy + r;
      const x = ox + c;
      if (y < 0 || x < 0 || x >= cols || y >= rows) continue;
      out[y * cols + x] = avg > 0 ? { shade: avg / 15, mat: Mat.Skin } : { shade: 0, mat: Mat.None };
    }
  }
  return out;
}

/** Fill the cells the frame leaves empty with the planet and stars. */
export function compositeScene(cells: Cell[], cols: number, rows: number, cellAspect: number): Cell[] {
  return cells.map((cell, i) =>
    cell.mat === Mat.None ? (sceneCell(i % cols, Math.floor(i / cols), cols, rows, cellAspect) ?? cell) : cell,
  );
}
