// ABOUTME: buildScene (spec §8.1): C's content (galleys, notes, survivors, the page) as pure data,
// ABOUTME: deterministic and DOM-free for a layout and a seed.
import { describe, expect, it } from 'vitest';
import { frameLayout } from './layout';
import { SEED, buildScene, headAt } from './scene';

const CASES = [
  ['1440x900 wide', () => frameLayout(1440, 844, 'wide', { left: 432, top: 42, right: 40, bottom: 64 })],
  ['390x844 narrow', () => frameLayout(390, 844, 'narrow', { left: 16, top: 70, right: 16, bottom: 168 })],
  ['600x372 still', () => frameLayout(600, 372, 'still')],
] as const;

describe('buildScene', () => {
  it('uses C’s seed by default', () => {
    expect(SEED).toBe(7193);
    const L = CASES[0][1]();
    expect(buildScene(L)).toEqual(buildScene(L, 7193));
  });

  for (const [name, make] of CASES) {
    describe(name, () => {
      it('returns identical output for identical input', () => {
        expect(buildScene(make(), 7193)).toEqual(buildScene(make(), 7193));
      });

      it('changes with the seed', () => {
        expect(buildScene(make(), 7193)).not.toEqual(buildScene(make(), 7194));
      });

      it('is plain data (no functions, survives a JSON round trip)', () => {
        const s = buildScene(make(), 7193);
        expect(JSON.parse(JSON.stringify(s))).toEqual(s);
      });

      it('has four kinds of source in 2 to 4 column groups', () => {
        const s = buildScene(make(), 7193);
        expect(s.groups).toBeGreaterThanOrEqual(2);
        expect(s.groups).toBeLessThanOrEqual(4);
        expect(s.cols).toHaveLength(4 * s.groups);
        expect(new Set(s.cols.map((c) => c.kind))).toEqual(new Set([0, 1, 2, 3]));
        for (const c of s.cols) expect(c.lines.length).toBeGreaterThan(5);
      });

      it('has notes with exactly two survivors, and the page inside the art box', () => {
        const s = buildScene(make(), 7193);
        expect(s.notes).toHaveLength(s.rowMode ? 7 : 6);
        expect(s.notes.filter((n) => n.surv)).toHaveLength(2);
        const A = s.layout.art;
        expect(s.page.x).toBeGreaterThanOrEqual(A.x - 0.01);
        expect(s.page.y).toBeGreaterThanOrEqual(A.y - 0.01);
        expect(s.page.x + s.page.w).toBeLessThanOrEqual(A.x + A.w + 0.01);
        expect(s.page.y + s.page.h).toBeLessThanOrEqual(A.y + A.h + 0.01);
        expect(s.stamp.d).toBeCloseTo(s.page.w * 0.42);
      });

      it('marks lines for the notes and routes survivors to page lines', () => {
        const s = buildScene(make(), 7193);
        expect(s.sel.length).toBeGreaterThan(0);
        for (const x of s.sel) expect(x.ln.sel).toBe(true);
        const survivors = s.sel.filter((x) => s.notes[x.n]!.surv);
        expect(survivors.length).toBeGreaterThan(0);
        for (const x of survivors) if (x.pl) expect(x.pl.kind).toBe('surv');
      });
    });
  }

  it('the test head sweeps the art box between p 0.595 and 0.735', () => {
    const s = buildScene(CASES[0][1](), 7193);
    const A = s.layout.art;
    expect(headAt(s, 0)).toBeCloseTo(A.x + A.w * 0.02);
    expect(headAt(s, 1)).toBeCloseTo(A.x + A.w * 0.98);
  });
});
