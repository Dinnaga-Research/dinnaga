// ABOUTME: PROTOTYPE (throwaway, branch prototype/cromulon) — an original, procedural Cromulon: a shaded
// ABOUTME: giant head (eyes, brows, wrinkles, open mouth) plus an optional planet and stars. No source still.

export type Scene = 'head' | 'scene';

export interface ArtBox {
  w: number;
  h: number;
}

const L = (() => {
  const v = [-0.45, -0.55, 0.7];
  const n = Math.hypot(v[0]!, v[1]!, v[2]!);
  return v.map((c) => c / n) as [number, number, number];
})();

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Brightness 0..1 of the head at head-space (x, y), both roughly in [-1, 1]; null outside the head. */
function head(x: number, y: number, mouth: number): number | null {
  const a = 0.78;
  const b = 0.98;
  const r = (x / a) ** 2 + (y / b) ** 2;
  if (r > 1) return null;
  const nz = Math.sqrt(1 - r);
  let s = 0.22 + 0.7 * Math.max(0, (x / a) * L[0] + (y / b) * L[1] + nz * L[2]);
  if (r > 0.93) s *= 0.45; // rim

  // Forehead wrinkles: three shallow arcs.
  for (let k = 0; k < 3; k++) {
    const cy = -0.8 + k * 0.07 + 0.06 * x * x;
    if (Math.abs(y - cy) < 0.012 && Math.abs(x) < 0.42 - k * 0.04) s *= 0.4;
  }

  for (const ex of [-0.3, 0.3]) {
    const ey = -0.28;
    // Brow: a thick, heavy arc above each eye, angled down toward the nose.
    const dx = (x - ex) / 0.25;
    if (Math.abs(dx) < 1) {
      const by = -0.53 + 0.1 * dx * dx + (ex < 0 ? 0.05 * dx : -0.05 * dx);
      if (Math.abs(y - by) < 0.045) return 0.06;
    }
    // Eye: big bright sclera, dark rim, small pupil looking down.
    const d = Math.hypot(x - ex, y - ey);
    if (d < 0.2) {
      const pd = Math.hypot(x - ex, y - (ey + 0.07));
      if (pd < 0.05) return 0.02;
      if (d > 0.175) return 0.18;
      return 0.98 - 0.25 * (d / 0.2) ** 2;
    }
  }

  // Nose: shaded ridge and nostrils.
  if (y > -0.14 && y < 0.14 && x > 0 && x < 0.07) s *= 0.55;
  for (const nx of [-0.06, 0.06]) if (Math.hypot(x - nx, y - 0.14) < 0.028) return 0.05;

  // Mouth: wide oval that opens; top teeth and a lower lip line.
  const mh = 0.05 + 0.2 * mouth;
  const mx = 0.44;
  const my = 0.47;
  const q = ((x / mx) ** 2 + ((y - my) / mh) ** 2);
  if (q < 1) {
    if (mouth > 0.12 && y < my - mh + 0.065) return 0.92; // teeth
    if (mouth > 0.4 && y > my + mh - 0.05) return 0.6; // lower teeth
    return 0.03;
  }
  if (q < 1.25) return 0.14; // lips

  // Chin crease and cheek lines.
  if (Math.abs(y - (0.84 - 0.08 * x * x)) < 0.012 && Math.abs(x) < 0.3) s *= 0.45;
  for (const cx of [-0.52, 0.52]) {
    if (Math.abs(x - cx - (y - 0.3) * (cx < 0 ? -0.25 : 0.25)) < 0.012 && y > 0.1 && y < 0.5) s *= 0.5;
  }
  return clamp01(s);
}

function planet(x: number, y: number): number | null {
  const r = Math.hypot(x, y);
  // Ring: a thin tilted ellipse band.
  const rx = x * Math.cos(0.35) + y * Math.sin(0.35);
  const ry = -x * Math.sin(0.35) + y * Math.cos(0.35);
  const ring = (rx / 1.9) ** 2 + (ry / 0.42) ** 2;
  if (r < 1) {
    if (ring > 0.82 && ring < 1 && ry > 0) return 0.75;
    const nz = Math.sqrt(1 - r * r);
    return clamp01(0.15 + 0.75 * Math.max(0, x * L[0] + y * L[1] + nz * L[2]) - (Math.abs(y - 0.2) < 0.08 ? 0.15 : 0));
  }
  if (ring > 0.82 && ring < 1) return 0.55;
  return null;
}

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Brightness 0..1 at art-box pixel (px, py). */
export function sampler(box: ArtBox, scene: Scene, mouth: number) {
  const R = Math.min(box.w * 0.3, box.h * 0.36);
  const hcx = scene === 'head' ? box.w * 0.64 : box.w * 0.66;
  const hcy = box.h * 0.6;
  const pr = R * 0.2;
  const pcx = box.w * 0.18;
  const pcy = box.h * 0.82;
  return (px: number, py: number): number => {
    const hv = head((px - hcx) / R, (py - hcy) / R, mouth);
    if (hv !== null) return hv;
    if (scene === 'scene') {
      const pv = planet((px - pcx) / pr, (py - pcy) / pr);
      if (pv !== null) return pv;
      const cx = Math.floor(px / 9);
      const cy = Math.floor(py / 9);
      if (hash(cx, cy) > 0.985 && (px % 9) < 2 && (py % 9) < 2) return 0.9;
    }
    return 0;
  };
}
