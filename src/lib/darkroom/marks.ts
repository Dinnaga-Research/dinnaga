// ABOUTME: C's timeline (spec §6, §8.1): the five chapter marks, the five still moments, 180 frames, the stage
// ABOUTME: at moment p, and the DOM overlay and hero state per moment (labels, stamp, the condensing h1).
import { ease, lerp, seg } from './ease';
import type { Scene } from './scene';

export const N_FRAMES = 180;
/** Timeline positions of the five chapter marks (fraction of the scrubbed run). */
export const MARKS = [0.06, 0.22, 0.4, 0.585, 0.78] as const;
/** The moment each stage's still shows (contact strip, /method). */
export const STILL_P = [0.2, 0.34, 0.575, 0.7, 1] as const;
/** A mark counts as reached this far before it. */
const MARK_TOLERANCE = 0.005;

/** Index of the current stage at p: -1 before the first mark. */
export function stageAt(p: number): number {
  let k = -1;
  for (let i = 0; i < MARKS.length; i++) if (p >= MARKS[i]! - MARK_TOLERANCE) k = i;
  return k;
}

export const frameAt = (p: number, n = N_FRAMES) => Math.round(Math.min(1, Math.max(0, p)) * (n - 1));
export const frameLabel = (i: number, n = N_FRAMES) => `Frame ${String(i + 1).padStart(3, '0')} / ${n}`;

export interface OverlayState {
  /** Opacity of the source labels. */
  lab: number;
  stampA: number;
  stampS: number;
  stamp: Scene['stamp'];
}

/** DOM overlay state at p: the source labels and the stamp landing (p 0.905 to 0.95, scale 1.32 to 1). */
export function overlayState(scene: Scene, p: number): OverlayState {
  const lab = (0.3 + 0.7 * ease(seg(p, 0, 0.2))) * (1 - seg(p, 0.4, 0.46));
  const sp = seg(p, 0.905, 0.95);
  return { lab, stampA: Math.min(1, sp * 2.5), stampS: lerp(1.32, 1, ease(sp)), stamp: scene.stamp };
}

export interface HeroState {
  /** The h1's width axis, 125 to 62. */
  w: number;
  alpha: number;
  /** Vertical shift as a percentage of the hero's height. */
  y: number;
}

/** The hero copy at p: the h1 condenses 125 to 62 over 0 to 0.07; the copy fades and lifts from 0.012. */
export function heroState(p: number): HeroState {
  const c = ease(seg(p, 0, 0.07));
  const f = ease(seg(p, 0.012, 0.072));
  return { w: lerp(125, 62, c), alpha: 1 - f, y: f === 0 ? 0 : -18 * f };
}

export const railVisible = (p: number) => p > 0.035;
