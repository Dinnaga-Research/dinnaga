// ABOUTME: PROTOTYPE (throwaway) — the three-quarter Cromulon drawn as ASCII on its own canvas grid, with an
// ABOUTME: original sum-of-sines plasma flowing through its shading. Motion: continuous, settle-after-5s, or static.
import { useEffect, useRef } from 'react';
import { Mat, renderHead, type Cell } from './head3d';
import type { Scene } from './model';

export type Charset = 'classic' | 'blocks' | 'dots';
export type Motion = 'continuous' | 'settle' | 'static';

const RAMPS: Record<Charset, string> = {
  classic: ' .:-=+*#%@',
  blocks: ' ░▒▓█',
  dots: ' ·•●',
};
const FONT_PX = 9;
const FRAME_OPEN = '/prototype-cromulon/frame.png'; // operator-supplied, git-excluded, local only
const FRAME_CLOSED = '/prototype-cromulon/frame-closed.png'; // optional

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

/** Luminance grid of an image fitted into the lower-right area of a cols × rows cell grid. */
function frameGrid(img: HTMLImageElement, cols: number, rows: number, cellAspect: number): Cell[] {
  const out: Cell[] = Array.from({ length: cols * rows }, () => ({ shade: 0, mat: Mat.None }));
  const boxW = cols * 0.78, boxH = rows * 0.7;
  const imgAspect = img.height / img.width; // in pixels; cells are cellAspect taller than wide
  let w = boxW, h = (boxW * imgAspect) / cellAspect;
  if (h > boxH) { h = boxH; w = (boxH * cellAspect) / imgAspect; }
  w = Math.round(w); h = Math.round(h);
  const ox = cols - w - 1, oy = rows - h - 1;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true })!;
  x.drawImage(img, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h).data;
  let lo = 1, hi = 0;
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const l = (0.2126 * d[i * 4]! + 0.7152 * d[i * 4 + 1]! + 0.0722 * d[i * 4 + 2]!) / 255;
    lum[i] = l; lo = Math.min(lo, l); hi = Math.max(hi, l);
  }
  for (let r = 0; r < h; r++) for (let cc = 0; cc < w; cc++) {
    const v = (lum[r * w + cc]! - lo) / (hi - lo || 1);
    out[(oy + r) * cols + ox + cc] = { shade: v, mat: v < 0.06 ? Mat.None : Mat.Skin };
  }
  return out;
}
const FPS = 15;
const SETTLE_MS = 5000;

interface PlasmaHeadProps {
  source: 'model' | 'frame';
  scene: Scene;
  opacity: number;
  charset: Charset;
  motion: Motion;
}

function plasma(x: number, y: number, t: number) {
  const v =
    Math.sin(x * 0.16 + t) +
    Math.sin(y * 0.21 - t * 1.3) +
    Math.sin((x + y) * 0.09 + t * 0.7) +
    Math.sin(Math.hypot(x - 40, y - 30) * 0.18 - t * 1.1);
  return v / 4; // -1..1
}

export function PlasmaHead({ source, scene, opacity, charset, motion }: PlasmaHeadProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const screen = canvas.parentElement!;
    const terminal = screen.closest('.terminal')!;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mode: Motion = reduce ? 'static' : motion;
    const ramp = RAMPS[charset];
    const ctx = canvas.getContext('2d')!;
    let cols = 0, rows = 0, cw = 0, ch = 0;
    let closed: Cell[] = [], open: Cell[] = [];
    let imgOpen: HTMLImageElement | null = null, imgClosed: HTMLImageElement | null = null;
    let mouthOpen = false;
    let t = 0;
    let speed = 1;
    let lastActive = performance.now();
    let visible = true;
    let raf = 0;
    let last = 0;
    let closeTimer = 0;

    const layout = () => {
      const w = screen.clientWidth, h = screen.clientHeight, dpr = devicePixelRatio || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${FONT_PX}px 'JetBrains Mono', monospace`;
      ctx.textBaseline = 'top';
      cw = ctx.measureText('M').width;
      ch = FONT_PX;
      cols = Math.floor(w / cw);
      rows = Math.floor(h / ch);
      const base = { cols, rows, cellAspect: ch / cw, scene };
      if (source === 'frame') {
        if (imgOpen) {
          open = frameGrid(imgOpen, cols, rows, ch / cw);
          closed = imgClosed && mode !== 'static' ? frameGrid(imgClosed, cols, rows, ch / cw) : open;
        } else {
          open = closed = [];
        }
        return;
      }
      closed = renderHead({ ...base, mouth: mode === 'static' ? 0.85 : 0.12 });
      open = mode === 'static' ? closed : renderHead({ ...base, mouth: 0.95 });
    };

    const draw = () => {
      const w = canvas.width, h = canvas.height;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.restore();
      ctx.fillStyle = getComputedStyle(screen).getPropertyValue('--term-green') || '#b8f720';
      const grid = mouthOpen ? open : closed;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid[r * cols + c];
          if (!cell) continue;
          if (cell.mat === Mat.None) continue;
          let b = cell.mat === Mat.Skin ? Math.pow(cell.shade, 1.35) : cell.shade; // deepen shadows so features read
          if (cell.mat === Mat.Skin || cell.mat === Mat.Planet) b *= 0.65 + 0.35 * (0.5 + 0.5 * plasma(c, r * 1.6, t));
          const ch2 = ramp[Math.min(ramp.length - 1, Math.round(b * (ramp.length - 1)))]!;
          if (ch2 !== ' ') ctx.fillText(ch2, c * cw, r * ch);
        }
      }
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      if (mode === 'settle' && now - lastActive > SETTLE_MS) return;
      if (now - last < 1000 / FPS) return;
      t += ((now - (last || now)) / 1000) * 1.4 * speed;
      last = now;
      draw();
    };

    const wake = () => {
      lastActive = performance.now();
      last = 0;
    };
    const onKey = (e: Event) => {
      if (!(e.target as HTMLElement).classList.contains('t-input')) return;
      wake();
      if (mode === 'static') return;
      mouthOpen = true;
      draw();
      clearTimeout(closeTimer);
      closeTimer = window.setTimeout(() => {
        mouthOpen = false;
        draw();
      }, 220);
    };
    const mo = new MutationObserver(() => {
      if (terminal.textContent?.includes('PASSPHRASE ACCEPTED')) {
        mo.disconnect();
        canvas.style.transition = mode === 'static' ? '' : 'opacity 800ms ease-out';
        canvas.style.opacity = '0.75';
        mouthOpen = true;
        speed = 3;
        wake();
        draw();
      }
    });
    const io = new IntersectionObserver(([e]) => (visible = !!e?.isIntersecting));

    const ready = source === 'frame'
      ? Promise.all([loadImage(FRAME_OPEN), loadImage(FRAME_CLOSED), document.fonts.ready]).then(([o, c]) => { imgOpen = o; imgClosed = c; })
      : document.fonts.ready;
    ready.then(() => {
      layout();
      draw();
      if (mode !== 'static') raf = requestAnimationFrame(loop);
    });
    const ro = new ResizeObserver(() => {
      layout();
      draw();
    });
    ro.observe(screen);
    io.observe(canvas);
    terminal.addEventListener('keydown', onKey);
    terminal.addEventListener('pointerenter', wake);
    mo.observe(terminal, { childList: true, subtree: true, characterData: true });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(closeTimer);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      terminal.removeEventListener('keydown', onKey);
      terminal.removeEventListener('pointerenter', wake);
    };
  }, [source, scene, charset, motion]);

  return <canvas ref={ref} className="crom-layer crom-plasma" aria-hidden="true" style={{ opacity }} />;
}
