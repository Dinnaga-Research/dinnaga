// ABOUTME: FrameStill (spec §8.2): one still of the sequence in a labelled canvas, painted once when it comes
// ABOUTME: within a viewport and again on a width change over 2 px. The painter loads lazily; nothing moves.
import { useEffect, useRef } from 'react';
import { Stamp } from './Stamp';
import './darkroom.css';

export type StillAspect = 'wide' | 'tall' | 'auto';

interface Props {
  /** The moment of the run, 0..1. */
  p: number;
  index: number;
  /** The canvas's accessible name. */
  label: string;
  aspect: StillAspect;
  /** Land the stamp on the sheet (the Ship still). */
  stamp?: boolean;
}

/** Height for a still w px wide: C's 0.62 (wide) or 1.2 (tall); auto picks wide above 560 px. */
function stillHeight(w: number, aspect: StillAspect): number {
  const wide = aspect === 'wide' || (aspect === 'auto' && w > 560);
  return Math.round(w * (wide ? 0.62 : 1.2));
}

const loadPainter = () => import('../../lib/darkroom/paint');

export function FrameStill({ p, index, label, aspect, stamp = false }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stampRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return;
    let live = true;
    let near = false;
    let paintedW = 0;

    const paint = async () => {
      const w = box.clientWidth;
      if (!live || !near || !w || Math.abs(w - paintedW) <= 2) return;
      paintedW = w;
      const h = stillHeight(w, aspect);
      canvas.style.height = `${h}px`;
      const { paintStill } = await loadPainter();
      if (!live) return;
      const res = paintStill(canvas, w, h, p, index, window.devicePixelRatio || 1);
      const st = stampRef.current;
      if (res && st) {
        const { cx, cy, d } = res.scene.stamp;
        st.style.width = st.style.height = `${d}px`;
        st.style.left = `${cx - d / 2}px`;
        st.style.top = `${cy - d / 2}px`;
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        near = true;
        io.disconnect();
        void paint();
      },
      { rootMargin: '100% 0px' },
    );
    io.observe(box);
    const ro = new ResizeObserver(() => void paint());
    ro.observe(box);
    return () => {
      live = false;
      io.disconnect();
      ro.disconnect();
    };
  }, [p, index, aspect]);

  return (
    <div className="still" data-aspect={aspect}>
      <div className="still__box" ref={boxRef}>
        <canvas ref={canvasRef} role="img" aria-label={label} />
        {stamp && <Stamp ref={stampRef} className="still__stamp" />}
      </div>
    </div>
  );
}
