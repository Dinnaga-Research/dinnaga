// ABOUTME: The frame store (spec §8.1, §8.4): baked frames kept as JPEG blobs, and an LRU of at most eight
// ABOUTME: decoded bitmaps around the playhead (evicted ones closed). bakeOrder gives the coarse-to-fine order.

/** Bake order: first and last frame, then every 64th, 32nd ... 1st, so any position soon has a near frame. */
export function bakeOrder(n: number): number[] {
  if (n <= 0) return [];
  const out = [0];
  const seen = new Set([0]);
  if (n > 1) {
    out.push(n - 1);
    seen.add(n - 1);
  }
  for (const step of [n, 64, 32, 16, 8, 4, 2, 1]) {
    for (let i = 0; i < n; i += step) {
      if (!seen.has(i)) {
        seen.add(i);
        out.push(i);
      }
    }
  }
  return out;
}

type Decoded = CanvasImageSource & { close?: () => void };

export interface StoreDeps {
  createImageBitmap?: (b: Blob) => Promise<ImageBitmap>;
  URL?: Pick<typeof URL, 'createObjectURL' | 'revokeObjectURL'>;
  /** Fallback decoder for engines without createImageBitmap(blob). */
  loadImage?: (url: string) => Promise<CanvasImageSource>;
}

export interface StoreStats {
  frames: number;
  baked: number;
  blobBytes: number;
  decoded: number;
  peakDecoded: number;
  urls: number;
}

const loadImageElement = (url: string) =>
  new Promise<CanvasImageSource>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

function defaultDeps(): StoreDeps {
  return {
    createImageBitmap: typeof createImageBitmap === 'function' ? (b) => createImageBitmap(b) : undefined,
    URL: typeof URL !== 'undefined' ? URL : undefined,
    loadImage: loadImageElement,
  };
}

/** At most this many decodes run at once; a newer request waits and replaces older waiting ones. */
const MAX_IN_FLIGHT = 3;

export class FrameStore {
  /** Live (undisposed) stores in this page: a remount must leave exactly one. */
  static alive = 0;

  readonly n: number;
  readonly capacity: number;
  onDecoded: ((i: number) => void) | null = null;

  private blobs = new Map<number, Blob>();
  private bytes = 0;
  private lru = new Map<number, Decoded>();
  private peak = 0;
  private inFlight = new Set<number>();
  private waiting: number | null = null;
  private urls = new Set<string>();
  private disposed = false;
  private deps: StoreDeps;

  constructor(n: number, deps: StoreDeps = defaultDeps(), capacity = 8) {
    this.n = n;
    this.capacity = capacity;
    this.deps = deps;
    FrameStore.alive++;
  }

  put(i: number, blob: Blob): void {
    if (this.disposed) return;
    const old = this.blobs.get(i);
    if (old) this.bytes -= old.size;
    this.blobs.set(i, blob);
    this.bytes += blob.size;
    const stale = this.lru.get(i);
    if (stale) {
      stale.close?.();
      this.lru.delete(i);
    }
  }

  has(i: number): boolean {
    return this.blobs.has(i);
  }

  /** The decoded frame i, if held; marks it most recently used. */
  get(i: number): CanvasImageSource | null {
    const d = this.lru.get(i);
    if (!d) return null;
    this.lru.delete(i);
    this.lru.set(i, d);
    return d;
  }

  /** Index of the nearest decoded frame within radius of i (i itself first), or -1. */
  nearest(i: number, radius = 2): number {
    if (this.lru.has(i)) return i;
    for (let d = 1; d <= radius; d++) {
      if (this.lru.has(i - d)) return i - d;
      if (this.lru.has(i + d)) return i + d;
    }
    return -1;
  }

  /** Start decoding frame i if it is baked and not already decoded or decoding. */
  request(i: number): void {
    if (this.disposed || !this.blobs.has(i) || this.lru.has(i) || this.inFlight.has(i)) return;
    if (this.inFlight.size >= MAX_IN_FLIGHT) {
      this.waiting = i;
      return;
    }
    const blob = this.blobs.get(i)!;
    this.inFlight.add(i);
    this.decode(blob).then(
      (d) => this.settle(i, d),
      () => this.settle(i, null),
    );
  }

  private decode(blob: Blob): Promise<Decoded> {
    const { createImageBitmap: cib, URL: U, loadImage } = this.deps;
    if (cib) return cib(blob);
    if (!U || !loadImage) return Promise.reject(new Error('no decoder'));
    const url = U.createObjectURL(blob);
    this.urls.add(url);
    const release = () => {
      if (this.urls.delete(url)) U.revokeObjectURL(url);
    };
    return loadImage(url).then(
      (img) => {
        release();
        return img;
      },
      (e) => {
        release();
        throw e;
      },
    );
  }

  private settle(i: number, d: Decoded | null): void {
    this.inFlight.delete(i);
    if (this.disposed) {
      d?.close?.();
      return;
    }
    if (d) {
      while (this.lru.size >= this.capacity) {
        const oldest = this.lru.keys().next().value as number;
        this.lru.get(oldest)!.close?.();
        this.lru.delete(oldest);
      }
      this.lru.set(i, d);
      this.peak = Math.max(this.peak, this.lru.size);
      this.onDecoded?.(i);
    }
    if (this.waiting != null) {
      const w = this.waiting;
      this.waiting = null;
      this.request(w);
    }
  }

  stats(): StoreStats {
    return {
      frames: this.n,
      baked: this.blobs.size,
      blobBytes: this.bytes,
      decoded: this.lru.size,
      peakDecoded: this.peak,
      urls: this.urls.size,
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    FrameStore.alive--;
    for (const d of this.lru.values()) d.close?.();
    this.lru.clear();
    for (const u of this.urls) this.deps.URL?.revokeObjectURL(u);
    this.urls.clear();
    this.blobs.clear();
    this.bytes = 0;
    this.waiting = null;
    this.onDecoded = null;
  }
}
