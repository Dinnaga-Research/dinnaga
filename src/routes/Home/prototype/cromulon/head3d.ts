// ABOUTME: PROTOTYPE (throwaway) — an original Cromulon head as a signed-distance field (smooth-union of
// ABOUTME: ellipsoids, capsule and spheres), ray-marched at a three-quarter angle into a shade + material grid.

type V3 = [number, number, number];

export const enum Mat {
  None = 0,
  Skin = 1,
  Eye = 2,
  Pupil = 3,
  Mouth = 4,
  Teeth = 5,
  Planet = 6,
}

export interface Cell {
  shade: number; // 0..1 lit brightness
  mat: Mat;
}

const len = (x: number, y: number, z: number) => Math.sqrt(x * x + y * y + z * z);

function ellipsoid(p: V3, c: V3, r: V3) {
  const x = (p[0] - c[0]) / r[0];
  const y = (p[1] - c[1]) / r[1];
  const z = (p[2] - c[2]) / r[2];
  const k0 = len(x, y, z);
  const k1 = len(x / r[0], y / r[1], z / r[2]);
  return k1 === 0 ? -Math.min(...r) : (k0 * (k0 - 1)) / k1;
}
const sphere = (p: V3, c: V3, r: number) => len(p[0] - c[0], p[1] - c[1], p[2] - c[2]) - r;
function capsule(p: V3, a: V3, b: V3, r: number) {
  const pa: V3 = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
  const ba: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const h = Math.max(0, Math.min(1, (pa[0] * ba[0] + pa[1] * ba[1] + pa[2] * ba[2]) / (ba[0] ** 2 + ba[1] ** 2 + ba[2] ** 2)));
  return len(pa[0] - ba[0] * h, pa[1] - ba[1] * h, pa[2] - ba[2] * h) - r;
}
function smin(a: number, b: number, k: number) {
  const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (b - a)) / k));
  return b + (a - b) * h - k * h * (1 - h);
}
function smax(a: number, b: number, k: number) {
  return -smin(-a, -b, k);
}

/** Distance and material for the head in head space (y up, z toward the face). */
function scene(p: V3, mouth: number): [number, Mat] {
  // Cranium: tall, slightly wider at the top, with a heavy jaw.
  let d = ellipsoid(p, [0, 0.05, 0], [0.82, 1.0, 0.78]);
  d = smin(d, ellipsoid(p, [0, -0.45, 0.12], [0.68, 0.5, 0.62]), 0.25);
  // Brow ridge.
  d = smin(d, capsule(p, [-0.52, 0.34, 0.6], [0.52, 0.34, 0.6], 0.1), 0.12);
  // Nose: long and bulbous.
  d = smin(d, ellipsoid(p, [0, -0.08, 0.8], [0.11, 0.24, 0.17]), 0.08);
  // Ears.
  d = smin(d, ellipsoid(p, [0.8, 0.02, -0.05], [0.1, 0.2, 0.12]), 0.06);
  d = smin(d, ellipsoid(p, [-0.8, 0.02, -0.05], [0.1, 0.2, 0.12]), 0.06);
  // Mouth: a wide cavity that opens.
  const mh = 0.07 + 0.2 * mouth;
  const cavity = ellipsoid(p, [0, -0.5, 0.74], [0.4, mh, 0.32]);
  d = smax(d, -cavity, 0.05);
  let mat = Mat.Skin;
  // Eyes: big protruding spheres; pupils look down and to the side.
  for (const ex of [-0.29, 0.29]) {
    const e = sphere(p, [ex, 0.12, 0.6], 0.19);
    if (e < d) {
      d = e;
      const pd = len(p[0] - (ex + 0.05), p[1] - 0.06, p[2] - 0.78);
      mat = pd < 0.075 ? Mat.Pupil : Mat.Eye;
    }
  }
  if (mat === Mat.Skin && cavity < 0.02) {
    const top = -0.5 + mh;
    mat = mouth > 0.15 && p[1] > top - 0.08 ? Mat.Teeth : mouth > 0.45 && p[1] < -0.5 - mh + 0.06 ? Mat.Teeth : Mat.Mouth;
  }
  return [d, mat];
}

function rotate(p: V3, yaw: number, pitch: number): V3 {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const x = p[0] * cy + p[2] * sy;
  const z = -p[0] * sy + p[2] * cy;
  return [x, p[1] * cp - z * sp, p[1] * sp + z * cp];
}

const LIGHT: V3 = (() => {
  const v: V3 = [-0.55, 0.6, 0.6];
  const n = len(...v);
  return [v[0] / n, v[1] / n, v[2] / n];
})();

export interface HeadOptions {
  cols: number;
  rows: number;
  cellAspect: number; // cell height / width
  mouth: number;
  scene: 'head' | 'scene';
  yaw?: number;
  pitch?: number;
}

/** Ray-march an orthographic three-quarter view into a cols × rows grid of shade + material. */
export function renderHead(o: HeadOptions): Cell[] {
  const yaw = o.yaw ?? 0.62; // ~35° turn: the face looks toward the viewer's left
  const pitch = o.pitch ?? -0.18; // looking slightly down, as if over a planet
  const out: Cell[] = new Array(o.cols * o.rows);
  // Art space: head occupies the right/lower area; 1 unit = head radius.
  const unitsPerCol = 2.75 / Math.min(o.cols, o.rows * o.cellAspect);
  const cx = o.cols * 0.64;
  const cy = o.rows * 0.66;
  for (let r = 0; r < o.rows; r++) {
    for (let c = 0; c < o.cols; c++) {
      const u = (c + 0.5 - cx) * unitsPerCol;
      const v = -(r + 0.5 - cy) * unitsPerCol * o.cellAspect;
      let cell: Cell = { shade: 0, mat: Mat.None };
      // March from z = 3 toward the head, in head space.
      let t = 0;
      for (let i = 0; i < 64; i++) {
        const p = rotate([u, v, 3 - t], yaw, pitch);
        const [d, mat] = scene(p, o.mouth);
        if (d < 0.004) {
          const e = 0.003;
          const nx = scene(rotate([u + e, v, 3 - t], yaw, pitch), o.mouth)[0] - scene(rotate([u - e, v, 3 - t], yaw, pitch), o.mouth)[0];
          const ny = scene(rotate([u, v + e, 3 - t], yaw, pitch), o.mouth)[0] - scene(rotate([u, v - e, 3 - t], yaw, pitch), o.mouth)[0];
          const nz = scene(rotate([u, v, 3 - t + e], yaw, pitch), o.mouth)[0] - scene(rotate([u, v, 3 - t - e], yaw, pitch), o.mouth)[0];
          const nl = len(nx, ny, nz) || 1;
          // Normal is in view space; light is fixed in view space.
          const diff = Math.max(0, (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / nl);
          const rim = Math.pow(1 - Math.abs(nz / nl), 3) * 0.25;
          let shade = 0.12 + 0.78 * diff + rim;
          if (mat === Mat.Eye) shade = 0.75 + 0.25 * diff;
          if (mat === Mat.Teeth) shade = 0.85;
          if (mat === Mat.Pupil || mat === Mat.Mouth) shade = 0.04;
          cell = { shade: Math.min(1, shade), mat };
          break;
        }
        t += Math.max(d * 0.9, 0.004);
        if (t > 6) break;
      }
      if (cell.mat === Mat.None && o.scene === 'scene') {
        // Planet with a ring, lower left; a few stars.
        const pu = (c - o.cols * 0.16) / (o.cols * 0.07);
        const pv = ((r - o.rows * 0.84) / (o.cols * 0.07)) * o.cellAspect;
        const pr = Math.hypot(pu, pv);
        const rx = pu * 0.94 + pv * 0.34;
        const ry = -pu * 0.34 + pv * 0.94;
        const ring = (rx / 1.9) ** 2 + (ry / 0.42) ** 2;
        if (pr < 1) {
          cell = { shade: 0.2 + 0.7 * Math.max(0, -pu * 0.55 - pv * 0.6 + Math.sqrt(1 - pr * pr) * 0.6), mat: Mat.Planet };
          if (ring > 0.8 && ring < 1 && ry > 0) cell = { shade: 0.8, mat: Mat.Planet };
        } else if (ring > 0.8 && ring < 1) {
          cell = { shade: 0.6, mat: Mat.Planet };
        } else {
          const h = Math.sin(c * 127.1 + r * 311.7) * 43758.5453;
          if (h - Math.floor(h) > 0.997) cell = { shade: 0.7, mat: Mat.Planet };
        }
      }
      out[r * o.cols + c] = cell;
    }
  }
  return out;
}
