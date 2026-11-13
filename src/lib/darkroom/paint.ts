// ABOUTME: paintFrame (spec §8.1, §3.4): one deterministic function paints any moment p in [0, 1] of the
// ABOUTME: distillation, monochrome; paintStill paints one still into a canvas. The stamp is DOM, not paint.
import { clamp01, ease as E, lerp, seg, smooth } from './ease';
import { makeFilm, type Film } from './film';
import { frameLayout } from './layout';
import { mix, rgb, type FramePalette, type RGB } from './palette';
import { mulberry32 } from './rng';
import { pixelScale } from './scale';
import { buildScene, headAt, type Rect, type Scene } from './scene';

export type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function bars(c: Ctx2D, w: number[], x: number, y: number, width: number, h: number) {
  for (let k = 0; k < w.length; k += 2) c.fillRect(x + w[k]! * width, y, (w[k + 1]! - w[k]!) * width, h);
}

/**
 * Paint moment p in CSS pixels; the caller sets the device-pixel transform.
 * Colours: grey type in `label`, read and marked type in `text`, the sheet in `text` with `ink` lines.
 */
export function paintFrame(c: Ctx2D, S: Scene, p: number, frameIndex: number, pal: FramePalette, film: Film | null): void {
  const { cols, colW, pitch, barH, sel, notes, page } = S;
  const { W, H, art: A } = S.layout;
  const GROUND = rgb(pal.ground);
  const GREY = rgb(pal.label);
  const PAPER = rgb(pal.text);
  const INK = rgb(pal.ink);
  // C's red marks (scan line, Digest's underlines, note marks, strikes, the test head) are paper (§3.4).
  const MARK = PAPER;

  c.globalAlpha = 1;
  c.fillStyle = GROUND;
  c.fillRect(0, 0, W, H);
  const expo = 0.24 + 0.76 * E(seg(p, 0, 0.2)); // Read: the latent image develops
  const digOn = p > 0.225;
  const scanY = A.y - pitch + (A.h + 2 * pitch) * smooth(seg(p, 0.23, 0.385)); // Digest: a scan line reads down
  const resid = lerp(1, 0.55, seg(p, 0.78, 0.9));
  const dyOf = (col: Scene['cols'][number]) => col.dy0 * (1 - E(seg(p, col.d, col.d + 0.16)));

  // sources: columns rise into a queue, get read, then fold away to the edges (Ideate)
  c.save();
  c.beginPath();
  c.rect(A.x - 2, A.y - 2, A.w + 4, A.h + 4);
  c.clip();
  for (const col of cols) {
    const dy = dyOf(col);
    const f = E(seg(p, 0.4 + col.fd, 0.52 + col.fd));
    const x = lerp(col.x, col.tx, f);
    const w = colW * (1 - 0.9 * f);
    const ca = lerp(1, 0.8, f) * resid;
    for (const b of col.blocks) {
      const y0 = A.y + dy + b.r0 * pitch - pitch * 0.35;
      const y1 = A.y + dy + (b.r1 + 1) * pitch - pitch * 0.15;
      if (y1 < A.y || y0 > A.y + A.h) continue;
      c.globalAlpha = ca * expo * (b.fill ? 0.1 : 0.4) * (digOn && scanY > y1 ? 0.5 : 1);
      if (b.fill) {
        c.fillStyle = GREY;
        c.fillRect(x - w * 0.02, y0, w * 1.04, y1 - y0);
      } else {
        c.strokeStyle = GREY;
        c.lineWidth = 1;
        c.strokeRect(x + 0.5, y0 + 0.5, w - 1, y1 - y0 - 1);
      }
    }
    c.fillStyle = GREY;
    for (const ln of col.lines) {
      if (ln.sel) continue;
      const y = A.y + dy + ln.row * pitch;
      if (y > A.y + A.h || y < A.y - pitch * 2) continue;
      let a = ln.tone * expo * ca;
      if (digOn) {
        const d = scanY - y;
        if (d > 0) a *= lerp(1, 0.34, Math.min(1, d / (pitch * 12)));
        if (Math.abs(d) < pitch * 2.5 && p < 0.39) a = Math.min(1, a * 1.7);
      }
      if (a < 0.012) continue;
      c.globalAlpha = a;
      bars(c, ln.w, x, y, w, barH * ln.h);
    }
  }
  c.restore();

  // the scan line itself
  const scanA = seg(p, 0.225, 0.24) * (1 - seg(p, 0.375, 0.395));
  if (scanA > 0) {
    c.globalAlpha = scanA;
    c.fillStyle = MARK;
    c.fillRect(A.x - 10, scanY, A.w + 20, Math.max(1, pitch * 0.18));
    c.fillRect(A.x - 10, scanY - 3, 4, 7);
  }

  // notes (Ideate) and the test (Experiment)
  const headX = headAt(S, p);
  const noteState = notes.map((nt) => ({
    strike: clamp01((headX - nt.x) / nt.w) * (p > 0.59 ? 1 : 0),
    fall: nt.surv ? 0 : E(seg(p, nt.passP + 0.006, nt.passP + 0.075)),
    out: nt.surv ? 0 : seg(p, 0.79, 0.86),
  }));
  const pr = E(seg(p, 0.785, 0.875));
  const paperA = E(seg(p, 0.8, 0.89));
  notes.forEach((nt, k) => {
    const st = noteState[k]!;
    let oa = seg(p, 0.49, 0.57);
    if (!nt.surv) oa *= lerp(1, 0.25, st.fall) * (1 - st.out);
    else oa *= 1 - seg(p, 0.785, 0.83);
    if (oa <= 0) return;
    const y = nt.y + st.fall * A.h * 0.14;
    const passed = nt.surv && p > nt.passP;
    c.globalAlpha = oa * (passed ? 0.95 : 0.42);
    c.strokeStyle = PAPER;
    c.lineWidth = passed ? 1.5 : 1;
    c.strokeRect(nt.x + 0.5, y + 0.5, nt.w, nt.h);
    c.globalAlpha = oa * (st.fall > 0 ? 0.35 : 0.95);
    c.fillStyle = MARK;
    c.fillRect(nt.x - 4, y + nt.h * 0.18, 2, nt.h * 0.42);
  });

  // the page rect grows from the survivors to the full sheet (Ship)
  const sb = S.survBox;
  const pageRect: Rect = { x: lerp(sb.x, page.x, pr), y: lerp(sb.y, page.y, pr), w: lerp(sb.w, page.w, pr), h: lerp(sb.h, page.h, pr) };

  const drawSel = (s: Scene['sel'][number]) => {
    const col = cols[s.c]!;
    const ln = s.ln;
    const nt = notes[s.n]!;
    const st = noteState[s.n]!;
    const y0 = A.y + dyOf(col) + ln.row * pitch;
    const t = E(seg(p, 0.405 + s.ord * 0.0028, 0.515 + s.ord * 0.0028));
    if (t === 0 && (y0 > A.y + A.h || y0 < A.y - pitch)) return;
    let x = lerp(col.x, nt.x + S.npad, t);
    let y = lerp(y0, nt.y + S.npad + s.slot * S.npitch, t);
    let w = lerp(colW, nt.w - 2 * S.npad, t);
    let h = lerp(barH * ln.h, S.nbar, t);
    const scanned = digOn && scanY > y0 + barH;
    let a = scanned || t > 0 ? 1 : ln.tone * expo;
    let color: RGB = scanned || t > 0 ? pal.text : pal.label;
    if (!nt.surv) {
      y += st.fall * A.h * 0.14;
      a *= lerp(1, 0.22, st.fall) * (1 - st.out);
      color = mix(color, pal.label, st.fall);
    } else if (s.pl) {
      const ts = E(seg(p, 0.79 + s.m! * 0.006, 0.88 + s.m! * 0.006));
      x = lerp(x, pageRect.x, ts);
      y = lerp(y, pageRect.y + s.pl.y * pageRect.h, ts);
      w = lerp(w, pageRect.w, ts);
      h = lerp(h, s.pl.h * pageRect.h, ts);
      color = mix(color, pal.ink, paperA);
      if (ts > 0) {
        // words re-set to the page measure: lerp the bar pattern toward the page line
        a *= lerp(1, s.pl.tone, paperA);
        c.globalAlpha = a;
        c.fillStyle = rgb(color);
        const wa = ln.w;
        const wb = s.pl.w;
        const k = Math.min(wa.length, wb.length);
        for (let i = 0; i < k; i += 2) {
          const l = lerp(wa[i]!, wb[i]!, ts);
          const r = lerp(wa[i + 1]!, wb[i + 1]!, ts);
          c.fillRect(x + l * w, y, (r - l) * w, h);
        }
        if (ts < 1) {
          c.globalAlpha = a * (1 - ts);
          for (let i = k; i < wa.length; i += 2) c.fillRect(x + wa[i]! * w, y, (wa[i + 1]! - wa[i]!) * w, h);
        }
        if (ts > 0.5) {
          c.globalAlpha = a * seg(ts, 0.5, 1);
          for (let i = k; i < wb.length; i += 2) c.fillRect(x + wb[i]! * w, y, (wb[i + 1]! - wb[i]!) * w, h);
        }
        return;
      }
    }
    if (a < 0.01) return;
    c.globalAlpha = a;
    c.fillStyle = rgb(color);
    bars(c, ln.w, x, y, w, h);
    const end = ln.w[ln.w.length - 1]!;
    if (scanned && t < 1) {
      // Digest's mark under what matters
      c.globalAlpha = (1 - t) * 0.95;
      c.fillStyle = MARK;
      c.fillRect(x + ln.w[0]! * w, y + h + Math.max(1, pitch * 0.12), (end - ln.w[0]!) * w, Math.max(1, pitch * 0.14));
    }
    if (!nt.surv && st.strike > 0) {
      // Experiment: struck out. Without red, a ground cut either side keeps the strike legible on paper bars.
      const sa = a * (st.fall > 0.5 ? 0.6 : 1);
      const sw = (nt.w - 6) * st.strike;
      c.globalAlpha = sa;
      c.fillStyle = GROUND;
      c.fillRect(nt.x + 3, y + h * 0.5 - 2, sw, 4);
      c.fillStyle = MARK;
      c.fillRect(nt.x + 3, y + h * 0.5 - 0.75, sw, 1.5);
    }
  };

  for (const s of sel) if (!notes[s.n]!.surv) drawSel(s);
  if (pr > 0) {
    const R = pageRect;
    c.globalAlpha = paperA;
    c.fillStyle = PAPER;
    c.fillRect(R.x, R.y, R.w, R.h);
    c.globalAlpha = 0.7 * (1 - paperA) * Math.min(1, pr * 4);
    c.strokeStyle = PAPER;
    c.lineWidth = 1;
    c.strokeRect(R.x + 0.5, R.y + 0.5, R.w - 1, R.h - 1);
    const nl = page.lines.length;
    c.fillStyle = INK;
    page.lines.forEach((pl, i) => {
      if (pl.kind === 'surv') return;
      const t0 = 0.86 + 0.08 * (i / nl);
      const a = seg(p, t0, t0 + 0.02) * pl.tone;
      if (a <= 0) return;
      c.globalAlpha = a;
      bars(c, pl.w, R.x, R.y + pl.y * R.h, R.w, Math.max(pl.kind === 'rule' ? 0.8 : 1, pl.h * R.h));
    });
  }
  for (const s of sel) if (notes[s.n]!.surv) drawSel(s);

  // the test head
  const hA = seg(p, 0.585, 0.6) * (1 - seg(p, 0.735, 0.752));
  if (hA > 0) {
    let top = Infinity;
    let bot = -Infinity;
    for (const n of notes) {
      top = Math.min(top, n.y);
      bot = Math.max(bot, n.y + n.h);
    }
    top -= pitch * 3;
    bot += pitch * 3;
    c.globalAlpha = hA;
    c.fillStyle = MARK;
    c.fillRect(headX - 0.75, top, 1.5, bot - top);
    c.fillRect(headX - 3.5, top - 7, 7, 7);
  }

  // film: vignette and per-frame grain, baked into each frame
  c.globalAlpha = 1;
  if (film?.vig) c.drawImage(film.vig, 0, 0, W, H);
  if (film?.grain) {
    const gs = film.grainCss;
    const r = mulberry32(frameIndex * 7919 + 13);
    const ox = r() * gs;
    const oy = r() * gs;
    for (let y = -oy; y < H; y += gs) for (let x = -ox; x < W; x += gs) c.drawImage(film.grain, x, y, gs, gs);
  }
  c.globalAlpha = 1;
}

export interface StillResult {
  scene: Scene;
  scale: number;
}

/** Paint one still (reduced motion's contact strip, /method) into a canvas sized w x h CSS px. */
export function paintStill(canvas: HTMLCanvasElement, w: number, h: number, p: number, index: number, pal: FramePalette, dpr: number): StillResult | null {
  const s = pixelScale(w, h, dpr);
  canvas.width = Math.max(1, Math.round(w * s));
  canvas.height = Math.max(1, Math.round(h * s));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const scene = buildScene(frameLayout(w, h, 'still'));
  ctx.setTransform(s, 0, 0, s, 0, 0);
  paintFrame(ctx, scene, p, index * 31, pal, makeFilm(scene, s));
  return { scene, scale: s };
}
