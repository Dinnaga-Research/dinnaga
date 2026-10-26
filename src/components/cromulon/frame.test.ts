// ABOUTME: Tests for the frame source selector and the fitter that places a data grid in the cell grid.
// ABOUTME: Synthetic grids only; the committed state has no generated frame module.
import { describe, expect, it } from 'vitest';
import { Mat } from './cell';
import { compositeScene, fitFrame, selectSource, type FrameData } from './frame';
import { sceneCell } from './scene';

describe('selectSource', () => {
  it('returns the SDF fallback for an empty glob result', () => {
    expect(selectSource({})).toEqual({ kind: 'sdf' });
  });

  it('returns the frame loader otherwise', () => {
    const loader = () => Promise.resolve({ CROMULON_FRAME: {} as FrameData });
    const s = selectSource({ './cromulon-frame.ts': loader });
    expect(s.kind).toBe('frame');
    if (s.kind === 'frame') expect(s.load).toBe(loader);
  });
});

describe('fitFrame', () => {
  const cols = 100;
  const rows = 60;
  const aspect = 1.67;
  const grid = new Uint8Array(160 * 120).fill(15);
  const cells = fitFrame(grid, 160, 120, cols, rows, aspect);

  it('returns a cols x rows grid', () => {
    expect(cells).toHaveLength(cols * rows);
  });

  it('places the grid inside the lower-right 0.78 x 0.70 box, one cell from the corner', () => {
    const filled: { c: number; r: number }[] = [];
    cells.forEach((cell, i) => {
      if (cell.mat !== Mat.None) filled.push({ c: i % cols, r: Math.floor(i / cols) });
    });
    expect(filled.length).toBeGreaterThan(0);
    const w = 78; // 0.78 * cols, width-limited: 78 * 0.75 / 1.67 = 35 rows <= 0.70 * rows
    const h = Math.round((78 * 0.75) / aspect);
    const minC = Math.min(...filled.map((f) => f.c));
    const maxC = Math.max(...filled.map((f) => f.c));
    const minR = Math.min(...filled.map((f) => f.r));
    const maxR = Math.max(...filled.map((f) => f.r));
    expect(minC).toBe(cols - w - 1);
    expect(maxC).toBe(cols - 2);
    expect(minR).toBe(rows - h - 1);
    expect(maxR).toBe(rows - 2);
    expect(maxC - minC + 1).toBeLessThanOrEqual(cols * 0.78);
    expect(maxR - minR + 1).toBeLessThanOrEqual(rows * 0.7);
  });

  it('maps level / 15 to shade and every non-zero level to Skin', () => {
    const g = new Uint8Array(4 * 4);
    g.fill(0);
    g[5] = 15;
    g[10] = 6;
    const c = fitFrame(g, 4, 4, 8, 8, 1);
    const skin = c.filter((x) => x.mat === Mat.Skin);
    expect(skin.length).toBeGreaterThan(0);
    expect(c.every((x) => x.mat === Mat.None || x.mat === Mat.Skin)).toBe(true);
    expect(Math.max(...skin.map((x) => x.shade))).toBeCloseTo(1, 5);
    expect(c.filter((x) => x.mat === Mat.None).every((x) => x.shade === 0)).toBe(true);
  });
});

describe('compositeScene', () => {
  it('fills only the cells the frame leaves empty', () => {
    const cols = 100;
    const rows = 60;
    const aspect = 1.67;
    const frame = fitFrame(new Uint8Array(16).fill(15), 4, 4, cols, rows, aspect);
    const out = compositeScene(frame, cols, rows, aspect);
    expect(out).toHaveLength(frame.length);
    let scene = 0;
    out.forEach((cell, i) => {
      if (frame[i]!.mat !== Mat.None) expect(cell).toBe(frame[i]);
      else {
        const s = sceneCell(i % cols, Math.floor(i / cols), cols, rows, aspect);
        if (s) {
          scene++;
          expect(cell.mat).toBe(Mat.Planet);
        }
      }
    });
    expect(scene).toBeGreaterThan(0);
  });
});
