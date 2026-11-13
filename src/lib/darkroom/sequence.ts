// ABOUTME: mountSequence (spec §8.1): the sticky-stage controller. It sizes the plate, bakes frames into the
// ABOUTME: store, draws on demand from the scroll scrub, drives the DOM overlay, and destroy() releases it all.
import { frameLayout, type ArtBox, type FrameGeometry, type FrameMode } from './layout';
import { makeFilm, type Film } from './film';
import { MARKS, N_FRAMES, frameAt, frameLabel, heroState, overlayState, railVisible, stageAt } from './marks';
import { paintFrame } from './paint';
import { readPalette, type FramePalette } from './palette';
import { pixelScale } from './scale';
import { SEED, buildScene, type Scene } from './scene';
import { createScrub, tweenScroll, type Tween } from './scrub';
import { FrameStore, bakeOrder, type StoreStats } from './store';

export interface SequenceOptions {
  /** The tall section whose scroll length is the run. */
  run: HTMLElement;
  /** The sticky stage inside it. */
  stage: HTMLElement;
  plate: HTMLCanvasElement;
  /** A box positioned by CSS where the art goes; its rect relative to the stage is the frame geometry. */
  art: HTMLElement;
  /** Source labels, one per kind of source, placed above their group of columns. */
  labels?: HTMLElement[];
  stamp?: HTMLElement | SVGElement | null;
  /** The hero copy: it fades and lifts; its h1 condenses 125 to 62 with frozen line breaks. */
  hero?: HTMLElement | null;
  counter?: HTMLElement | null;
  onStage?: (k: number) => void;
  frames?: number;
  seed?: number;
  /** Starting JPEG quality of baked frames. */
  quality?: number;
  /** Bytes the 180 frame blobs may take; the bake lowers JPEG quality to stay under it (spec §8.4: 40 MB). */
  byteBudget?: number;
  dpr?: number;
  /** Rail jump duration in ms (0 under reduced motion). */
  jumpMs?: number;
}

export interface SequenceStats extends StoreStats {
  stores: number;
  setups: number;
  mode: FrameMode | null;
  art: ArtBox | null;
  scale: number;
  canvas: { w: number; h: number };
  p: number;
  /** JPEG quality the bake is using now. */
  quality: number;
  paints: number;
  paintMedianMs: number | null;
  livePaints: number;
  draws: number;
  firstFrameMs: number | null;
  firstLastMs: number | null;
  bakeDoneMs: number | null;
}

export interface SequenceHandle {
  /** Scroll the window to stage k's mark (eased, or instant when jumpMs is 0). */
  jumpTo(k: number): void;
  /** Render moment p directly (used by tests and the harness; scrolling also calls it). */
  setProgress(p: number): void;
  stats(): SequenceStats;
  destroy(): void;
}

const NARROW_BELOW = 760;
/** 40 MB less headroom: WebKit's encoder makes grainy frames twice the size Chromium's does. */
const BYTE_BUDGET = 37e6;
const MIN_QUALITY = 0.4;
const QUALITY_STEP = 0.05;
const REBUILD_MS = 220;
const IGNORE_HEIGHT_BELOW = 120;
const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};

export function mountSequence(opts: SequenceOptions): SequenceHandle {
  const { run, stage, plate, art, labels = [], stamp = null, hero = null, counter = null, onStage } = opts;
  const N = opts.frames ?? N_FRAMES;
  const seed = opts.seed ?? SEED;
  const quality = opts.quality ?? 0.78;
  const byteBudget = opts.byteBudget ?? BYTE_BUDGET;
  let bakeQuality = quality;
  const jumpMs = opts.jumpMs ?? 1300;
  const h1 = hero?.querySelector('h1') ?? null;
  const h1Text = h1 && h1.childElementCount === 0 ? h1.textContent : null;
  const t0 = performance.now();
  const life = new AbortController();
  const dctx = plate.getContext('2d', { alpha: false });

  let dead = false;
  let token = 0;
  let scene: Scene | null = null;
  let film: Film | null = null;
  let pal: FramePalette | null = null;
  let s = 1;
  let store: FrameStore | null = null;
  let bakeCanvas: HTMLCanvasElement | null = null;
  let prog = 0;
  let playhead = 0;
  let shownExact = false;
  let pending = 0;
  let visible = true;
  let stageIdx: number | null = null;
  let lastFrameNo = -1;
  let setupTimer: ReturnType<typeof setTimeout> | null = null;
  let tween: Tween | null = null;
  let setups = 0;
  let draws = 0;
  let livePaints = 0;
  const paintMs: number[] = [];
  let firstFrameMs: number | null = null;
  let firstLastMs: number | null = null;
  let bakeDoneMs: number | null = null;
  let sized = { W: 0, H: 0 };

  const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

  function geometry(): FrameGeometry {
    const sr = stage.getBoundingClientRect();
    const ar = art.getBoundingClientRect();
    return { left: ar.left - sr.left, top: ar.top - sr.top, right: sr.right - ar.right, bottom: sr.bottom - ar.bottom };
  }

  // The headline's line breaks are frozen at full width, so condensing narrows each line instead of re-wrapping.
  function freezeLines() {
    if (!h1 || h1Text == null || dead) return;
    const w = h1.style.getPropertyValue('--dn-hero-w');
    h1.textContent = h1Text;
    h1.style.setProperty('--dn-hero-w', '125');
    const words = h1Text.split(' ');
    h1.innerHTML = '';
    const spans = words.map((word, i) => {
      const sp = document.createElement('span');
      sp.textContent = word;
      h1.append(sp);
      if (i < words.length - 1) h1.append(' ');
      return sp;
    });
    const lines: { top: number; words: string[] }[] = [];
    for (const sp of spans) {
      const top = Math.round(sp.offsetTop);
      const L = lines[lines.length - 1];
      if (L && Math.abs(L.top - top) < 4) L.words.push(sp.textContent ?? '');
      else lines.push({ top, words: [sp.textContent ?? ''] });
    }
    h1.innerHTML = '';
    lines.forEach((l, i) => {
      const ln = document.createElement('span');
      ln.className = 'ln';
      ln.textContent = l.words.join(' ');
      h1.append(ln);
      if (i < lines.length - 1) h1.append(' ');
    });
    if (w) h1.style.setProperty('--dn-hero-w', w);
    else h1.style.removeProperty('--dn-hero-w');
  }

  function setup() {
    setupTimer = null;
    if (dead) return;
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    if (!W || !H) return;
    setups++;
    sized = { W, H };
    const mode: FrameMode = W >= NARROW_BELOW ? 'wide' : 'narrow';
    s = pixelScale(W, H, opts.dpr ?? window.devicePixelRatio ?? 1);
    plate.width = Math.round(W * s);
    plate.height = Math.round(H * s);
    // Explicit CSS size: a small height change (a phone's URL bar) shows more ground instead of stretching.
    plate.style.width = `${W}px`;
    plate.style.height = `${H}px`;
    pal = readPalette(stage);
    scene = buildScene(frameLayout(W, H, mode, geometry()), seed);
    film = makeFilm(scene, s);
    const r = rem();
    labels.forEach((el, g) => {
      const col = scene!.cols[g * scene!.groups];
      if (col) el.style.transform = `translate(${col.x}px, ${scene!.layout.art.y - 1.25 * r}px)`;
    });
    if (stamp) {
      const st = scene.stamp;
      const el = stamp as HTMLElement;
      el.style.width = el.style.height = `${st.d}px`;
      el.style.left = `${st.cx - st.d / 2}px`;
      el.style.top = `${st.cy - st.d / 2}px`;
    }
    freezeLines();
    store?.dispose();
    store = new FrameStore(N);
    store.onDecoded = (i) => {
      if (i === playhead && !shownExact) requestDraw();
    };
    shownExact = false;
    lastFrameNo = -1;
    void bake(++token);
    requestDraw();
  }

  const whenVisible = () =>
    new Promise<void>((resolve) => {
      const done = () => {
        document.removeEventListener('visibilitychange', done);
        life.signal.removeEventListener('abort', done);
        resolve();
      };
      document.addEventListener('visibilitychange', done);
      life.signal.addEventListener('abort', done);
    });
  const nextTask = () =>
    new Promise<void>((resolve) => {
      const t = setTimeout(resolve, 0);
      life.signal.addEventListener('abort', () => {
        clearTimeout(t);
        resolve();
      }, { once: true });
    });
  const toBlob = (c: HTMLCanvasElement, q: number) => new Promise<Blob | null>((resolve) => c.toBlob(resolve, 'image/jpeg', q));

  async function bake(tk: number) {
    const S0 = scene!;
    const film0 = film;
    const pal0 = pal!;
    const s0 = s;
    const st = store!;
    if (bakeCanvas) bakeCanvas.width = bakeCanvas.height = 0;
    const off = (bakeCanvas = document.createElement('canvas'));
    off.width = plate.width;
    off.height = plate.height;
    const c = off.getContext('2d', { alpha: false });
    if (!c) return;
    let haveFirst = false;
    let haveLast = false;
    // Adaptive quality: after a few frames at one quality, project the total; step down while it is over budget.
    let q = (bakeQuality = quality);
    let bytes = 0;
    let done = 0;
    let sumAtQ = 0;
    let nAtQ = 0;
    for (const i of bakeOrder(N)) {
      while (document.hidden && tk === token && !dead) await whenVisible(); // pause while the tab is hidden
      if (tk !== token || dead) return;
      c.setTransform(s0, 0, 0, s0, 0, 0);
      const t = performance.now();
      paintFrame(c, S0, N > 1 ? i / (N - 1) : 0, i, pal0, film0);
      paintMs.push(performance.now() - t);
      const blob = await toBlob(off, q);
      if (tk !== token || dead || !blob) return;
      st.put(i, blob);
      bytes += blob.size;
      done++;
      sumAtQ += blob.size;
      nAtQ++;
      if (done < N && nAtQ >= 3 && q > MIN_QUALITY + 1e-9 && bytes + (sumAtQ / nAtQ) * (N - done) > byteBudget) {
        q = bakeQuality = Math.max(MIN_QUALITY, Math.round((q - QUALITY_STEP) * 100) / 100);
        sumAtQ = 0;
        nAtQ = 0;
      }
      if (i === 0) haveFirst = true;
      if (i === N - 1) haveLast = true;
      if (firstLastMs == null && haveFirst && haveLast) firstLastMs = performance.now() - t0;
      if (!shownExact && Math.abs(i - playhead) <= 2) requestDraw();
      await nextTask();
    }
    if (tk === token && !dead) {
      bakeDoneMs = performance.now() - t0;
      off.width = off.height = 0; // the bake canvas is only needed while baking
      bakeCanvas = null;
    }
  }

  function requestDraw() {
    if (!pending && !dead) pending = requestAnimationFrame(() => {
      pending = 0;
      draw();
    });
  }

  // Render on demand only: nothing runs unless the scroll position or a newly ready frame changes the picture.
  function draw() {
    if (!scene || !visible || !dctx || !store || !pal || dead) return;
    draws++;
    const i0 = frameAt(prog, N);
    const dir = i0 >= playhead ? 1 : -1;
    playhead = i0;
    store.request(i0);
    store.request(i0 + dir);
    const k = store.nearest(i0, 2);
    dctx.setTransform(1, 0, 0, 1, 0, 0);
    dctx.globalAlpha = 1;
    if (k >= 0) {
      dctx.drawImage(store.get(k)!, 0, 0);
      shownExact = k === i0;
    } else {
      dctx.setTransform(s, 0, 0, s, 0, 0);
      const t = performance.now();
      paintFrame(dctx, scene, prog, i0, pal, film);
      paintMs.push(performance.now() - t);
      livePaints++;
      dctx.setTransform(1, 0, 0, 1, 0, 0);
      shownExact = true;
    }
    if (firstFrameMs == null) firstFrameMs = performance.now() - t0;
    const o = overlayState(scene, prog);
    for (const el of labels) el.style.opacity = String(o.lab);
    if (stamp) {
      const el = stamp as HTMLElement;
      el.style.opacity = String(o.stampA);
      el.style.transform = `rotate(-8deg) scale(${o.stampS})`;
    }
    if (counter && i0 !== lastFrameNo) {
      lastFrameNo = i0;
      counter.textContent = frameLabel(i0, N);
    }
  }

  function applyProgress(p: number) {
    prog = p;
    stage.style.setProperty('--dn-run-p', p.toFixed(4));
    stage.style.setProperty('--dn-rail-a', railVisible(p) ? '1' : '0');
    if (hero) {
      const hs = heroState(p);
      hero.style.opacity = String(hs.alpha);
      hero.style.transform = hs.y ? `translateY(${hs.y}%)` : '';
      // Faded, not hidden: its links stay focusable, and CSS shows the hero again while one has focus.
      hero.style.pointerEvents = hs.alpha < 0.05 ? 'none' : '';
      h1?.style.setProperty('--dn-hero-w', hs.w.toFixed(2));
    }
    const k = stageAt(p);
    if (k !== stageIdx) {
      stageIdx = k;
      onStage?.(k);
    }
    if (pending) {
      cancelAnimationFrame(pending);
      pending = 0;
    }
    draw();
  }

  // Progress through the sticky stretch: 0 when the stage sticks, 1 when it lets go.
  function readProgress() {
    const rr = run.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    const span = rr.height - sr.height;
    if (span <= 0) return 0;
    return Math.min(1, Math.max(0, (sr.top - rr.top) / span));
  }

  const scrub = createScrub({ read: readProgress, apply: applyProgress, tau: 0.12 });

  window.addEventListener('scroll', () => scrub.kick(), { passive: true, signal: life.signal });
  window.addEventListener('resize', () => scrub.kick(), { passive: true, signal: life.signal });

  const ro = new ResizeObserver(() => {
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    if (!scene) {
      if (setupTimer) clearTimeout(setupTimer);
      setupTimer = setTimeout(setup, 0);
      return;
    }
    const widthChanged = Math.abs(W - sized.W) > 1;
    const heightChanged = Math.abs(H - sized.H) >= IGNORE_HEIGHT_BELOW;
    if (!widthChanged && !heightChanged) return;
    if (setupTimer) clearTimeout(setupTimer);
    setupTimer = setTimeout(setup, REBUILD_MS);
  });
  ro.observe(stage);

  const io = new IntersectionObserver((es) => {
    visible = es.some((e) => e.isIntersecting);
    if (visible) requestDraw();
  });
  io.observe(stage);

  document.fonts?.ready.then(() => {
    if (!dead) freezeLines();
  });

  applyProgress(readProgress());

  return {
    jumpTo(k: number) {
      const mark = MARKS[k];
      if (mark == null || dead) return;
      const rr = run.getBoundingClientRect();
      const span = rr.height - stage.clientHeight;
      const stickTop = parseFloat(getComputedStyle(stage).top) || 0;
      const y = rr.top + window.scrollY - stickTop + (mark + 0.002) * span;
      tween?.cancel();
      tween = tweenScroll(y, jumpMs);
    },
    setProgress(p: number) {
      applyProgress(Math.min(1, Math.max(0, p)));
    },
    stats(): SequenceStats {
      const st = store?.stats() ?? { frames: N, baked: 0, blobBytes: 0, decoded: 0, peakDecoded: 0, urls: 0 };
      return {
        ...st,
        stores: FrameStore.alive,
        setups,
        mode: scene?.layout.mode ?? null,
        art: scene ? { ...scene.layout.art } : null,
        scale: s,
        canvas: { w: plate.width, h: plate.height },
        p: prog,
        quality: bakeQuality,
        paints: paintMs.length,
        paintMedianMs: median(paintMs),
        livePaints,
        draws,
        firstFrameMs,
        firstLastMs,
        bakeDoneMs,
      };
    },
    destroy() {
      if (dead) return;
      dead = true;
      token++;
      life.abort();
      scrub.destroy();
      tween?.cancel();
      if (pending) cancelAnimationFrame(pending);
      pending = 0;
      if (setupTimer) clearTimeout(setupTimer);
      setupTimer = null;
      ro.disconnect();
      io.disconnect();
      store?.dispose();
      store = null;
      if (bakeCanvas) bakeCanvas.width = bakeCanvas.height = 0;
      bakeCanvas = null;
      if (h1 && h1Text != null) {
        h1.textContent = h1Text;
        h1.style.removeProperty('--dn-hero-w');
      }
      scene = null;
      film = null;
    },
  };
}
