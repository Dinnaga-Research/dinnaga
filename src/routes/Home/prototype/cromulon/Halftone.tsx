// ABOUTME: PROTOTYPE (throwaway) — draws the procedural Cromulon as a braille-style dot halftone on a
// ABOUTME: canvas (no font involved). Optional reactions: mouth opens on keystrokes, face resolves on unlock.
import { useEffect, useRef } from 'react';
import { sampler, type Scene } from './model';

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const PITCH = 3.5; // css px between dots: a braille cell (2×4 dots) is 7 × 14 px

interface HalftoneProps {
  scene: Scene;
  opacity: number;
  reactive: boolean;
}

export function Halftone({ scene, opacity, reactive }: HalftoneProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const screen = canvas.parentElement!;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let mouth = reactive ? 0.15 : 0.85;
    let raf = 0;
    let closeTimer = 0;

    const draw = () => {
      const w = screen.clientWidth;
      const h = screen.clientHeight;
      const dpr = devicePixelRatio || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = getComputedStyle(screen).getPropertyValue('--term-green') || '#b8f720';
      const sample = sampler({ w, h }, scene, mouth);
      for (let gy = 0, y = PITCH / 2; y < h; gy++, y += PITCH) {
        for (let gx = 0, x = PITCH / 2; x < w; gx++, x += PITCH) {
          const b = sample(x, y);
          if (b > (BAYER[gy & 3]![gx & 3]! + 0.5) / 16) {
            ctx.beginPath();
            ctx.arc(x, y, 1.3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    };
    const redraw = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    };
    draw();
    const ro = new ResizeObserver(redraw);
    ro.observe(screen);

    const cleanups: (() => void)[] = [];
    if (reactive && !reduce) {
      const terminal = screen.closest('.terminal')!;
      const onKey = (e: Event) => {
        if (!(e.target as HTMLElement).classList.contains('t-input')) return;
        mouth = 0.95;
        redraw();
        clearTimeout(closeTimer);
        closeTimer = window.setTimeout(() => {
          mouth = 0.15;
          redraw();
        }, 220);
      };
      terminal.addEventListener('keydown', onKey);
      cleanups.push(() => terminal.removeEventListener('keydown', onKey));
      // Unlock: the reveal script types "PASSPHRASE ACCEPTED." — resolve the face to full strength.
      const mo = new MutationObserver(() => {
        if (terminal.textContent?.includes('PASSPHRASE ACCEPTED')) {
          canvas.style.transition = 'opacity 800ms ease-out';
          canvas.style.opacity = '0.7';
          mouth = 0.95;
          redraw();
          mo.disconnect();
        }
      });
      mo.observe(terminal, { childList: true, subtree: true, characterData: true });
      cleanups.push(() => mo.disconnect());
    }
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(closeTimer);
      cleanups.forEach((c) => c());
    };
  }, [scene, reactive]);

  return <canvas ref={ref} className="crom-layer crom-halftone" aria-hidden="true" style={{ opacity }} />;
}
