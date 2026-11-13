// ABOUTME: frameLayout (spec §8.1): where the art sits inside a frame. Wide and narrow take the art box insets
// ABOUTME: measured from the stage (label column, rail and caption clearances live in CSS); still fills the box.

export type FrameMode = 'wide' | 'narrow' | 'still';

/** Insets of the art box inside the stage, in CSS px, read from the DOM by the sequence. */
export interface FrameGeometry {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface ArtBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FrameLayout {
  W: number;
  H: number;
  mode: FrameMode;
  art: ArtBox;
}

const MIN_ART = 40;

export function frameLayout(W: number, H: number, mode: FrameMode, geometry?: FrameGeometry): FrameLayout {
  if (mode === 'still' || !geometry) {
    const m = Math.max(12, Math.min(W, H) * 0.05);
    return { W, H, mode, art: { x: m, y: m + 4, w: Math.max(MIN_ART, W - 2 * m), h: Math.max(MIN_ART, H - 2 * m - 4) } };
  }
  const g = geometry;
  const w = Math.max(MIN_ART, W - g.left - g.right);
  const inner = H - g.top - g.bottom;
  const h = mode === 'narrow' ? Math.max(200, inner) : Math.max(MIN_ART, inner);
  return { W, H, mode, art: { x: g.left, y: g.top, w, h } };
}
