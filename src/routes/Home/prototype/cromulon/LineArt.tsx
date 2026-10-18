// ABOUTME: PROTOTYPE (throwaway) — an original, hand-drawn strict-ASCII Cromulon (95 printable chars only),
// ABOUTME: with mouth-open and mouth-closed frames and an optional planet + stars, scaled to fit the screen.
import { useEffect, useRef, useState } from 'react';
import type { Scene } from './model';

const TOP = String.raw`
              _..-------.._
          .-''   _   _   _ ''-.
        .'     ~~ ~~~ ~~ ~~    '.
       /    _______   _______    \
      |    / .---. \ / .---. \    |
      |   | ( (o) ) | ( (o) ) |   |
      |    \ '---' / \ '---' /    |
      |     '-----'   '-----'     |
      |             _             |
      |            ( )            |
      |           (_ _)           |`;

const OPEN = String.raw`
       \     .-------------.     /
        \   ( VVVVVVVVVVVVV )   /
         \  (               )  /
          \  ( ^^^^^^^^^^^ )  /
           '. '-----------' .'
             '-._________.-'`;

const CLOSED = String.raw`
       \                         /
        \    .-------------.    /
         \    '-----------'    /
          \                   /
           '.               .'
             '-._________.-'`;

const PLANET = String.raw`
   .        *
        .
  .-"""-.      *
 (  ~~~  )
  '-...-'   .
      *`;

interface LineArtProps {
  scene: Scene;
  opacity: number;
  reactive: boolean;
}

export function LineArt({ scene, opacity, reactive }: LineArtProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(!reactive);
  const [size, setSize] = useState(12);
  useEffect(() => {
    const el = ref.current!;
    const screen = el.parentElement!;
    const fit = () => {
      const rows = 18;
      const cols = 36;
      const byH = (screen.clientHeight * 0.9) / (rows * 1.12);
      const byW = (screen.clientWidth * 0.62) / (cols * 0.6);
      setSize(Math.max(6, Math.min(byH, byW)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(screen);
    let t = 0;
    const terminal = screen.closest('.terminal')!;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const onKey = (e: Event) => {
      if (!reactive || reduce || !(e.target as HTMLElement).classList.contains('t-input')) return;
      setOpen(true);
      clearTimeout(t);
      t = window.setTimeout(() => setOpen(false), 220);
    };
    terminal.addEventListener('keydown', onKey);
    return () => {
      ro.disconnect();
      clearTimeout(t);
      terminal.removeEventListener('keydown', onKey);
    };
  }, [reactive]);

  return (
    <div ref={ref} className="crom-layer crom-lineart" aria-hidden="true" style={{ opacity, fontSize: `${size}px` }}>
      <pre className="crom-head">{TOP.slice(1) + (open ? OPEN : CLOSED)}</pre>
      {scene === 'scene' && <pre className="crom-planet">{PLANET.slice(1)}</pre>}
    </div>
  );
}
