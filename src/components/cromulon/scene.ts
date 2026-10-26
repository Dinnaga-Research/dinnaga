// ABOUTME: The Cromulon's backdrop: a small ringed planet lower left and a few stars.
// ABOUTME: Only fills cells the head leaves empty, so a converted frame can be composited over it later.
import { Mat, type Cell } from './cell';

/** The planet or star cell at (c, r) in a cols x rows grid, or null when the cell is empty sky. */
export function sceneCell(c: number, r: number, cols: number, rows: number, cellAspect: number): Cell | null {
  const pu = (c - cols * 0.16) / (cols * 0.07);
  const pv = ((r - rows * 0.84) / (cols * 0.07)) * cellAspect;
  const pr = Math.hypot(pu, pv);
  const rx = pu * 0.94 + pv * 0.34;
  const ry = -pu * 0.34 + pv * 0.94;
  const ring = (rx / 1.9) ** 2 + (ry / 0.42) ** 2;
  if (pr < 1) {
    if (ring > 0.8 && ring < 1 && ry > 0) return { shade: 0.8, mat: Mat.Planet };
    return {
      shade: 0.2 + 0.7 * Math.max(0, -pu * 0.55 - pv * 0.6 + Math.sqrt(1 - pr * pr) * 0.6),
      mat: Mat.Planet,
    };
  }
  if (ring > 0.8 && ring < 1) return { shade: 0.6, mat: Mat.Planet };
  const h = Math.sin(c * 127.1 + r * 311.7) * 43758.5453;
  if (h - Math.floor(h) > 0.997) return { shade: 0.7, mat: Mat.Planet };
  return null;
}
