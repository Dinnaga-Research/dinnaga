// ABOUTME: The scroll scrub and the rail tween (spec §6, §7.6, §8.1), in place of GSAP: rAF runs only while
// ABOUTME: the frames settle toward the scroll target; tweenScroll eases the window and yields to user input.
import { ease } from './ease';

type Raf = (cb: FrameRequestCallback) => number;
type Caf = (id: number) => void;

interface Clock {
  raf?: Raf;
  caf?: Caf;
  now?: () => number;
}

const defaultRaf: Raf = (cb) => requestAnimationFrame(cb);
const defaultCaf: Caf = (id) => cancelAnimationFrame(id);
const defaultNow = () => performance.now();

export interface ScrubOptions extends Clock {
  /** The target progress, from the scroll position. */
  read: () => number;
  /** Render progress p. */
  apply: (p: number) => void;
  /** Settle time constant in seconds. */
  tau?: number;
}

export interface Scrub {
  /** Something moved the target: settle toward it (starts the rAF loop if idle). */
  kick(): void;
  /** Go to the target at once. */
  jump(): void;
  value(): number;
  destroy(): void;
}

const EPS = 1e-4;
/** Longest step a frame may take, so a throttled tab does not jump straight to the target. */
const MAX_DT = 0.1;

export function createScrub({ read, apply, tau = 0.12, raf = defaultRaf, caf = defaultCaf, now = defaultNow }: ScrubOptions): Scrub {
  let p = 0;
  let id = 0;
  let last = 0;
  let dead = false;

  const frame: FrameRequestCallback = (t) => {
    id = 0;
    if (dead) return;
    const dt = Math.min(MAX_DT, Math.max(0, (t - last) / 1000));
    last = t;
    const target = read();
    p += (target - p) * (1 - Math.exp(-dt / tau));
    if (Math.abs(target - p) < EPS) {
      p = target;
      apply(p);
      return;
    }
    apply(p);
    id = raf(frame);
  };

  return {
    kick() {
      if (dead || id) return;
      if (Math.abs(read() - p) < EPS) return;
      last = now();
      id = raf(frame);
    },
    jump() {
      if (dead) return;
      if (id) caf(id);
      id = 0;
      p = read();
      apply(p);
    },
    value: () => p,
    destroy() {
      dead = true;
      if (id) caf(id);
      id = 0;
    },
  };
}

export interface TweenOptions extends Clock {
  getY?: () => number;
  scrollTo?: (y: number) => void;
  /** Where user input is heard; any wheel, touch, pointer or key input cancels the tween. */
  inputTarget?: EventTarget;
}

export interface Tween {
  cancel(): void;
}

const INPUTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;

/** Ease the window's scroll to y over ms with the signature curve; ms <= 0 jumps (reduced motion). */
export function tweenScroll(y: number, ms: number, opts: TweenOptions = {}): Tween {
  const {
    getY = () => window.scrollY,
    scrollTo = (v: number) => window.scrollTo(0, v),
    inputTarget = typeof window !== 'undefined' ? window : undefined,
    raf = defaultRaf,
    caf = defaultCaf,
    now = defaultNow,
  } = opts;
  if (ms <= 0) {
    scrollTo(y);
    return { cancel() {} };
  }
  const y0 = getY();
  const t0 = now();
  let id = 0;
  let done = false;
  const stop = () => {
    if (done) return;
    done = true;
    if (id) caf(id);
    id = 0;
    for (const type of INPUTS) inputTarget?.removeEventListener(type, stop);
  };
  for (const type of INPUTS) inputTarget?.addEventListener(type, stop, { passive: true });
  const frame: FrameRequestCallback = (t) => {
    id = 0;
    if (done) return;
    const k = Math.min(1, (t - t0) / ms);
    scrollTo(k >= 1 ? y : y0 + (y - y0) * ease(k));
    if (k >= 1) stop();
    else id = raf(frame);
  };
  id = raf(frame);
  return { cancel: stop };
}
