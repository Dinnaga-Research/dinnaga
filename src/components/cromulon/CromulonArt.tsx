// ABOUTME: The Cromulon art layer: one aria-hidden canvas inside the Terminal screen, drawn in plasma ASCII.
// ABOUTME: Plasma flows for 5 s after load or activity, then holds; keystrokes open the mouth; unlock brightens it.
import { useEffect, useRef } from 'react';
import { Mat, renderHead } from './head3d';
import { shouldAnimate } from './motion';
import { plasma, rampChar } from './ramp';
import type { Cell } from './cell';
import type { RefObject } from 'react';

const FONT_PX = 9;
const FONT = `${FONT_PX}px 'JetBrains Mono', monospace`;
const RESIZE_DEBOUNCE_MS = 100;
const SHOW_ME_MOUTH = 0.85;
const CLOSED_MOUTH = 0.12;
const OPEN_MOUTH = 0.95;
const FPS = 15;
const MOUTH_MS = 220;
const FLOW_RATE = 1.4;
const UNLOCK_SPEED = 3;

interface CromulonArtProps {
  unlocked: boolean;
  keystrokes: number;
  /** The Terminal root: hovering it wakes the plasma. */
  hoverRef: RefObject<HTMLElement | null>;
}

interface Engine {
  keystroke: () => void;
  unlock: () => void;
}


export default function CromulonArt({ unlocked, keystrokes, hoverRef }: CromulonArtProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const engine = useRef<Engine | null>(null);
  const seenKeys = useRef(keystrokes);

  useEffect(() => {
    const canvas = ref.current;
    const screen = canvas?.parentElement;
    if (!canvas || !screen) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // jsdom or a very old browser: draw nothing
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = hoverRef.current;
    let cancelled = false;
    let timer = 0;
    let closeTimer = 0;
    let lastW = -1;
    let lastH = -1;
    let cols = 0;
    let rows = 0;
    let cw = 0;
    let closed: Cell[] = [];
    let open: Cell[] = [];
    let mouthOpen = false;
    let isUnlocked = false;
    let visible = true;
    let t = 0;
    let speed = 1;
    let lastActive = performance.now();
    let lastFrame = 0;
    let raf = 0;

    const layout = () => {
      const w = screen.clientWidth;
      const h = screen.clientHeight;
      if (w <= 0 || h <= 0) return false;
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
      cw = ctx.measureText('M').width;
      if (!(cw > 0)) return false;
      cols = Math.floor(w / cw);
      rows = Math.floor(h / FONT_PX);
      const base = { cols, rows, cellAspect: FONT_PX / cw, scene: 'scene' as const };
      if (reduced) {
        closed = open = renderHead({ ...base, mouth: SHOW_ME_MOUTH });
      } else {
        closed = renderHead({ ...base, mouth: CLOSED_MOUTH });
        open = renderHead({ ...base, mouth: OPEN_MOUTH });
      }
      return true;
    };

    const draw = () => {
      if (cols <= 0 || rows <= 0) return;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      ctx.fillStyle = getComputedStyle(screen).getPropertyValue('--dn-term-text').trim() || '#b8f720';
      const cells = mouthOpen ? open : closed;
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

    const may = (now: number) =>
      shouldAnimate({ now, lastActive, visible, hidden: document.hidden, reduced, unlocked: isUnlocked });

    const loop = (now: number) => {
      raf = 0;
      if (cancelled || !may(now)) return; // settled, hidden or off-screen: stop asking for frames
      if (now - lastFrame >= 1000 / FPS) {
        t += ((now - (lastFrame || now)) / 1000) * FLOW_RATE * speed;
        lastFrame = now;
        draw();
      }
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (raf || cancelled || reduced || cols <= 0) return;
      if (!may(performance.now())) return;
      raf = requestAnimationFrame(loop);
    };

    const wake = () => {
      if (reduced) return;
      lastActive = performance.now();
      lastFrame = 0;
      start();
    };

    engine.current = {
      keystroke: () => {
        if (reduced) return;
        wake();
        if (isUnlocked) return; // the mouth stays open
        mouthOpen = true;
        draw();
        window.clearTimeout(closeTimer);
        closeTimer = window.setTimeout(() => {
          if (isUnlocked) return;
          mouthOpen = false;
          draw();
        }, MOUTH_MS);
      },
      unlock: () => {
        if (reduced) return; // opacity alone changes (CSS); no loop
        isUnlocked = true;
        speed = UNLOCK_SPEED;
        mouthOpen = true;
        window.clearTimeout(closeTimer);
        wake();
        draw();
      },
    };

    const fonts = document.fonts;
    const ready = fonts
      ? Promise.all([fonts.ready, fonts.load(FONT).catch(() => [])])
      : Promise.resolve();
    ready.then(() => {
      if (cancelled || !layout()) return;
      draw();
      start();
    });

    const ro = new ResizeObserver(() => {
      if (screen.clientWidth === lastW && screen.clientHeight === lastH) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (cancelled || !layout()) return;
        draw();
      }, RESIZE_DEBOUNCE_MS);
    });
    ro.observe(screen);

    const io = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
      if (visible) wake();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) {
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      } else {
        wake();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    root?.addEventListener('pointerenter', wake);

    return () => {
      cancelled = true;
      engine.current = null;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.clearTimeout(closeTimer);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      root?.removeEventListener('pointerenter', wake);
    };
  }, [hoverRef]);

  useEffect(() => {
    if (keystrokes === seenKeys.current) return;
    seenKeys.current = keystrokes;
    engine.current?.keystroke();
  }, [keystrokes]);

  useEffect(() => {
    if (unlocked) engine.current?.unlock();
  }, [unlocked]);

  return (
    <canvas
      ref={ref}
      className={unlocked ? 'cromulon-art is-unlocked' : 'cromulon-art'}
      aria-hidden="true"
    />
  );
}
