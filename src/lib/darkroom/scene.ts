// ABOUTME: buildScene (spec §8.1): c.html's content as plain data: four kinds of grey galley, the notes and
// ABOUTME: their two survivors, and the one clean page. Deterministic for a layout and a seed; no DOM.
import { seg } from './ease';
import type { ArtBox, FrameLayout } from './layout';
import { mulberry32, type Rng } from './rng';

export const SEED = 7193;

export type LineType = 'title' | 'meta' | 'head' | 'body' | 'speaker' | 'code';

/** One line of a galley: bar pairs [a0, b0, a1, b1, ...] as fractions of the column width. */
export interface GalleyLine {
  row: number;
  w: number[];
  h: number;
  tone: number;
  type: LineType;
  sel?: boolean;
}

export interface GalleyBlock {
  r0: number;
  r1: number;
  fill: boolean;
}

export interface Column {
  i: number;
  kind: number;
  x: number;
  lines: GalleyLine[];
  blocks: GalleyBlock[];
  dy0: number;
  d: number;
  fd: number;
  tx: number;
}

export interface Note {
  x: number;
  y: number;
  w: number;
  h: number;
  surv: boolean;
  passP: number;
}

export type PageLineKind = 'title' | 'field' | 'rule' | 'surv' | 'body';

export interface PageLine {
  y: number;
  w: number[];
  h: number;
  tone: number;
  kind: PageLineKind;
}

/** A galley line Digest marks as mattering; it travels to a note slot and, if the note survives, to the page. */
export interface Selected {
  c: number;
  ln: GalleyLine;
  n: number;
  slot: number;
  ord: number;
  m?: number;
  pl?: PageLine;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Scene {
  layout: FrameLayout;
  cols: Column[];
  colW: number;
  pitch: number;
  barH: number;
  groups: number;
  sel: Selected[];
  notes: Note[];
  rowMode: boolean;
  npitch: number;
  nbar: number;
  npad: number;
  page: Rect & { lines: PageLine[] };
  survBox: Rect;
  stamp: { cx: number; cy: number; d: number };
}

// Word bars between a and b (fractions of column width); justified lines end exactly at b.
function words(R: Rng, a: number, b: number, just: boolean, minW = 0.05, maxW = 0.2): number[] {
  const out: number[] = [];
  let x = a;
  while (x < b - 0.04) {
    const e = Math.min(x + minW + R() * (maxW - minW), b);
    out.push(x, e);
    x = e + 0.034;
  }
  if (just && out.length) out[out.length - 1] = b;
  return out;
}

// Four textures of grey type, one per kind of source. Abstract: bars, not words.
function galley(kind: number, rows: number, R: Rng): { lines: GalleyLine[]; blocks: GalleyBlock[] } {
  const lines: GalleyLine[] = [];
  const blocks: GalleyBlock[] = [];
  const L = (row: number, w: number[], h = 1, tone = 0.62, type: LineType = 'body') => lines.push({ row, w, h, tone, type });
  let r = 0;
  if (kind === 0) {
    // papers: title, authors, justified paragraphs, the odd figure
    L(r, words(R, 0, 0.92, false, 0.12, 0.3), 1.7, 1, 'title');
    r += 2;
    L(r, words(R, 0, 0.55, false, 0.12, 0.3), 1.7, 1, 'title');
    r += 2;
    L(r, words(R, 0, 0.45, false), 0.8, 0.7, 'meta');
    r += 2;
    while (r < rows) {
      if (R() < 0.1 && r + 10 < rows) {
        blocks.push({ r0: r, r1: r + 7, fill: false });
        r += 8;
        L(r, words(R, 0.1, 0.7, false), 0.7, 0.5, 'meta');
        r += 2;
        continue;
      }
      if (R() < 0.12) {
        L(r, words(R, 0, 0.35 + R() * 0.2, false), 1.2, 0.95, 'head');
        r += 2;
      }
      const n = 4 + ((R() * 6) | 0);
      for (let i = 0; i < n && r < rows; i++, r++) L(r, words(R, i === 0 ? 0.08 : 0, i === n - 1 ? 0.3 + R() * 0.5 : 1, i !== n - 1));
      r += 1;
    }
  } else if (kind === 1) {
    // podcasts: turns with a speaker mark and a gutter mark, ragged right
    L(r, words(R, 0, 0.7, false, 0.12, 0.3), 1.5, 1, 'title');
    r += 2;
    L(r, words(R, 0, 0.3, false), 0.8, 0.7, 'meta');
    r += 2;
    while (r < rows) {
      L(r, [0, 0.11], 0.8, 0.45, 'meta');
      lines.push({ row: r, w: [0.17, 0.17 + 0.1 + R() * 0.1], h: 1.1, tone: 0.95, type: 'speaker' });
      L(r, words(R, 0.36, 0.6 + R() * 0.4, false));
      r++;
      const n = 1 + ((R() * 5) | 0);
      for (let i = 0; i < n && r < rows; i++, r++) L(r, words(R, 0.17, 0.55 + R() * 0.45, false));
      r += 1;
    }
  } else if (kind === 2) {
    // vendor docs: headings, prose, indented code blocks on a tint
    L(r, words(R, 0, 0.6, false, 0.12, 0.3), 1.6, 1, 'title');
    r += 3;
    while (r < rows) {
      const n = 2 + ((R() * 4) | 0);
      for (let i = 0; i < n && r < rows; i++, r++) L(r, words(R, 0, 0.6 + R() * 0.4, false));
      r += 1;
      if (R() < 0.75 && r + 8 < rows) {
        const k = 3 + ((R() * 6) | 0);
        blocks.push({ r0: r, r1: r + k - 1, fill: true });
        let lvl = 0;
        for (let i = 0; i < k; i++, r++) {
          lvl = Math.max(0, Math.min(3, lvl + ((R() * 3) | 0) - 1));
          const a = 0.06 + lvl * 0.08;
          const out: number[] = [];
          let x = a;
          const m = 1 + ((R() * 4) | 0);
          for (let j = 0; j < m && x < 0.9; j++) {
            const e = Math.min(x + 0.04 * (1 + ((R() * 4) | 0)), 0.94);
            out.push(x, e);
            x = e + 0.04;
          }
          L(r, out, 0.9, 0.55, 'code');
        }
        r += 1;
      }
      if (R() < 0.3) {
        L(r, words(R, 0, 0.3 + R() * 0.25, false), 1.2, 0.95, 'head');
        r += 2;
      }
    }
  } else {
    // releases: heading with a tag, bulleted changes
    while (r < rows) {
      L(r, words(R, 0, 0.32, false, 0.1, 0.25), 1.6, 1, 'title');
      L(r, [0.4, 0.4 + 0.12 + R() * 0.08], 1.6, 0.7, 'meta');
      r += 3;
      const s = 2 + ((R() * 3) | 0);
      for (let q = 0; q < s && r < rows; q++) {
        L(r, words(R, 0, 0.18 + R() * 0.12, false), 1.05, 0.9, 'head');
        r += 2;
        const b = 2 + ((R() * 5) | 0);
        for (let i = 0; i < b && r < rows; i++) {
          L(r, [0.02, 0.055], 0.9, 0.8, 'meta');
          L(r, words(R, 0.1, 0.45 + R() * 0.55, false));
          r++;
          if (R() < 0.2 && r < rows) {
            L(r, words(R, 0.1, 0.3 + R() * 0.4, false));
            r++;
          }
        }
        r += 1;
      }
      r += 1;
    }
  }
  return { lines: lines.filter((l) => l.row < rows), blocks };
}

// Seeded Fisher-Yates. C shuffled with sort(() => R() - 0.5), whose result depends on the engine's sort.
function shuffle<T>(arr: T[], R: Rng): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (R() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

const HEAD_FROM = 0.595;
const HEAD_TO = 0.735;

/** The test head's x at moment p: it sweeps the art box during Experiment. */
export function headAt(scene: Scene, p: number): number {
  const A = scene.layout.art;
  return A.x + A.w * (0.02 + 0.96 * seg(p, HEAD_FROM, HEAD_TO));
}

export function buildScene(layout: FrameLayout, seed = SEED): Scene {
  const R = mulberry32(seed);
  const A: ArtBox = layout.art;
  const groups = Math.max(2, Math.min(4, Math.round(A.w / 300)));
  const n = 4 * groups;
  const gap = Math.max(4, A.w * 0.014);
  const colW = (A.w - gap * (n - 1)) / n;
  const pitch = Math.max(4.4, colW * 0.104);
  const barH = pitch * 0.44;
  const rows = Math.floor((A.h * 1.05) / pitch);
  const half = n / 2;
  const cols: Column[] = [];
  for (let i = 0; i < n; i++) {
    const kind = Math.floor(i / groups);
    const j = i < half ? i : n - 1 - i;
    const g = galley(kind, rows, R);
    cols.push({
      i,
      kind,
      x: A.x + i * (colW + gap),
      ...g,
      dy0: A.h * (0.16 + 0.62 * R()),
      d: R() * 0.045,
      fd: j * 0.0035,
      tx: i < half ? A.x + j * (colW * 0.1 + 3) : A.x + A.w - j * (colW * 0.1 + 3) - colW * 0.1,
    });
  }

  // notes: a row of slips on wide frames, a grid of three on tall ones
  const rowMode = A.w / A.h > 1.05;
  const nNotes = rowMode ? 7 : 6;
  const per = rowMode ? 3 : 2;
  const survivors = rowMode ? [2, 5] : [1, 5];
  const npitch = pitch * 2.3;
  const nbar = barH * 1.6;
  const npad = Math.max(8, pitch * 1.6);
  const nh = npad * 2 + (per - 1) * npitch + nbar;
  const notes: Note[] = [];
  if (rowMode) {
    const nw = Math.min(A.w * 0.118, 170);
    const span = A.w * 0.88;
    const g = (span - nw * nNotes) / (nNotes - 1);
    for (let k = 0; k < nNotes; k++) notes.push({ x: A.x + A.w * 0.06 + k * (nw + g), y: A.y + A.h * 0.42 - nh / 2, w: nw, h: nh, surv: false, passP: 0 });
  } else {
    const nw = A.w * 0.28;
    const g = (A.w - 3 * nw) / 4;
    for (let k = 0; k < nNotes; k++)
      notes.push({ x: A.x + g + (k % 3) * (nw + g), y: A.y + A.h * 0.3 + Math.floor(k / 3) * (nh + nh * 0.7), w: nw, h: nh, surv: false, passP: 0 });
  }
  notes.forEach((nt, k) => {
    nt.surv = survivors.includes(k);
    // each note is judged as the test head crosses it
    nt.passP = HEAD_FROM + ((HEAD_TO - HEAD_FROM) * ((nt.x + nt.w - A.x) / A.w - 0.02)) / 0.96;
  });

  // pick the lines Digest marks as "what actually matters": spread across every column
  const elig = cols.map((c) =>
    c.lines.filter((l) => l.type === 'body' && l.w.length > 4 && l.w[l.w.length - 1]! - l.w[0]! > 0.55 && l.row > 6 && l.row * pitch < A.h * 0.9),
  );
  const total = nNotes * per;
  const sel: Selected[] = [];
  const order = shuffle([...cols.keys()], R);
  for (let k = 0; k < total; k++) {
    const ci = order[k % n]!;
    const pool = elig[ci]!.filter((l) => !l.sel);
    if (!pool.length) continue;
    const ln = pool[(R() * pool.length) | 0]!;
    ln.sel = true;
    sel.push({ c: ci, ln, n: 0, slot: 0, ord: 0 });
  }
  shuffle(sel, R).forEach((s, idx) => {
    s.n = idx % nNotes;
    s.slot = Math.floor(idx / nNotes);
  });
  sel.sort((a, b) => a.ln.row - b.ln.row || a.c - b.c).forEach((s, idx) => (s.ord = idx));

  // the page: one clean living document
  let ph = A.h * 0.92;
  let pw = ph / 1.32;
  if (pw > A.w * 0.9) {
    pw = A.w * 0.9;
    ph = pw * 1.32;
  }
  const page: Scene['page'] = { x: A.x + (A.w - pw) / 2, y: A.y + (A.h - ph) / 2, w: pw, h: ph, lines: [] };
  {
    const mx = 0.11;
    const rp = 1 / 41;
    const tw = 1 - 2 * mx;
    let r = 3.2;
    const PL = (w: number[], h: number, tone: number, kind: PageLineKind) =>
      page.lines.push({ y: r * rp, w: w.map((v) => mx + v * tw), h: h * rp * 0.44, tone, kind });
    PL(words(R, 0, 0.86, false, 0.12, 0.3), 2.4, 1, 'title');
    r += 1.8;
    PL(words(R, 0, 0.5, false, 0.12, 0.3), 2.4, 1, 'title');
    r += 2;
    PL(words(R, 0, 0.3, false), 0.9, 0.7, 'title');
    PL([0.34, 0.47], 0.9, 1, 'field');
    r += 1.2;
    PL([0, 1], 0.12, 0.7, 'rule');
    r += 1.6;
    let body = 0;
    const para = (count: number) => {
      for (let i = 0; i < count; i++, r++) {
        PL(words(R, i === 0 ? 0.06 : 0, i === count - 1 ? 0.35 + R() * 0.4 : 1, i !== count - 1), 1, 0.82, body < survivors.length * per ? 'surv' : 'body');
        body++;
      }
      r += 0.9;
    };
    para(6);
    para(5);
    PL(words(R, 0, 0.36, false), 1.3, 1, 'title');
    r += 1.6;
    para(7);
    para(4);
  }
  const survLines = page.lines.filter((l) => l.kind === 'surv');
  let m = 0;
  for (const s of sel) if (notes[s.n]!.surv) s.m = m++;
  for (const s of sel) if (s.m != null && survLines[s.m]) s.pl = survLines[s.m];

  const sv = notes.filter((nt) => nt.surv);
  const x0 = Math.min(...sv.map((nt) => nt.x)) - 6;
  const y0 = Math.min(...sv.map((nt) => nt.y)) - 6;
  const survBox: Rect = {
    x: x0,
    y: y0,
    w: Math.max(...sv.map((nt) => nt.x + nt.w)) + 6 - x0,
    h: Math.max(...sv.map((nt) => nt.y + nt.h)) + 6 - y0,
  };
  const stamp = { cx: page.x + page.w * 0.71, cy: page.y + page.h * 0.8, d: page.w * 0.42 };
  return { layout, cols, colW, pitch, barH, groups, sel, notes, rowMode, npitch, nbar, npad, page, survBox, stamp };
}
