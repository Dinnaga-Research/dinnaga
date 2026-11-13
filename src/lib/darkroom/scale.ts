// ABOUTME: The pixel-ratio budget for frame canvases (spec §8.1, §8.4): min(dpr, 1.15) up to DPR 2, else
// ABOUTME: min(dpr, 1.5); then a 1920x1200 pixel ceiling per canvas and a 0.5 floor.

export const MAX_CANVAS_PIXELS = 1920 * 1200;

export function pixelScale(w: number, h: number, dpr: number): number {
  const d = dpr > 0 ? dpr : 1;
  const s = d <= 2 ? Math.min(d, 1.15) : Math.min(d, 1.5);
  const cap = Math.sqrt(MAX_CANVAS_PIXELS / Math.max(1, w * h));
  return Math.max(0.5, Math.min(s, cap));
}
