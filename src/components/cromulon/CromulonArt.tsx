// ABOUTME: The Cromulon art layer: one aria-hidden canvas inside the Terminal screen, drawn in plasma ASCII.
// ABOUTME: Still in this build; it lays out after fonts load and again, debounced, when the screen resizes.
import { useEffect, useRef } from 'react';
import { Mat, renderHead } from './head3d';
import { plasma, rampChar } from './ramp';

const FONT_PX = 9;
const FONT = `${FONT_PX}px 'JetBrains Mono', monospace`;
const RESIZE_DEBOUNCE_MS = 100;
const SHOW_ME_MOUTH = 0.85;

export default function CromulonArt() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const screen = canvas?.parentElement;
    if (!canvas || !screen) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // jsdom or a very old browser: draw nothing
    let cancelled = false;
    let timer = 0;
    let lastW = -1;
    let lastH = -1;

    const render = () => {
      const w = screen.clientWidth;
      const h = screen.clientHeight;
      if (w <= 0 || h <= 0) return;
      lastW = w;
      lastH = h;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = FONT;
      ctx.textBaseline = 'top';
      const cw = ctx.measureText('M').width;
      if (!(cw > 0)) return;
      const cols = Math.floor(w / cw);
      const rows = Math.floor(h / FONT_PX);
      const cells = renderHead({ cols, rows, cellAspect: FONT_PX / cw, mouth: SHOW_ME_MOUTH, scene: 'scene' });
      const t = 0;
      ctx.fillStyle = getComputedStyle(screen).getPropertyValue('--dn-term-text').trim() || '#b8f720';
      for (let r = 0; r < rows; r++) {
        let line = '';
        let any = false;
        for (let c = 0; c < cols; c++) {
          const cell = cells[r * cols + c];
          if (!cell || cell.mat === Mat.None) {
            line += ' ';
            continue;
          }
          let b = cell.mat === Mat.Skin ? Math.pow(cell.shade, 1.35) : cell.shade; // deepen shadows so features read
          if (cell.mat === Mat.Skin || cell.mat === Mat.Planet) {
            b *= 0.65 + 0.35 * (0.5 + 0.5 * plasma(c, r * 1.6, t));
          }
          const ch = rampChar(b);
          if (ch !== ' ') any = true;
          line += ch;
        }
        if (any) ctx.fillText(line, 0, r * FONT_PX);
      }
    };

    const fonts = document.fonts;
    const ready = fonts
      ? Promise.all([fonts.ready, fonts.load(FONT).catch(() => [])])
      : Promise.resolve();
    ready.then(() => {
      if (!cancelled) render();
    });

    const ro = new ResizeObserver(() => {
      if (screen.clientWidth === lastW && screen.clientHeight === lastH) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!cancelled) render();
      }, RESIZE_DEBOUNCE_MS);
    });
    ro.observe(screen);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="cromulon-art" aria-hidden="true" />;
}
