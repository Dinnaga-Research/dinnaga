// ABOUTME: E2E for the frame-sequence engine on the DEV harness /dev/frames (spec §8.4): budgets, rail and stage
// ABOUTME: behaviour, hidden-tab pause, SPA remounts, reduced motion, no CDN, and the runtime chunk's size and split.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { expect, test, type Page } from '@playwright/test';

const MARKS = [0.06, 0.22, 0.4, 0.585, 0.78];
const NAMES = ['Read', 'Digest', 'Ideate', 'Experiment', 'Ship'];

interface Stats {
  frames: number;
  baked: number;
  blobBytes: number;
  decoded: number;
  peakDecoded: number;
  urls: number;
  stores: number;
  firstFrameMs: number | null;
  firstLastMs: number | null;
  p: number;
  raf: number;
}

// Counts rAF callbacks and blob URLs from the first script on, independent of the harness's own counter.
async function instrument(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __raf: number; __blobUrls: number };
    w.__raf = 0;
    w.__blobUrls = 0;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => raf((t) => (w.__raf++, cb(t)));
    const create = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (o) => (w.__blobUrls++, create(o));
  });
}

const stats = (page: Page) =>
  page.evaluate(() => {
    const o = document.querySelector('output');
    return o?.dataset.stats ? (JSON.parse(o.dataset.stats) as Stats) : null;
  });

async function open(page: Page) {
  await page.goto('/dev/frames');
  await expect(page.locator('canvas.plate')).toBeAttached();
  await expect.poll(async () => (await stats(page))?.frames ?? 0).toBe(180);
}

const baked = (page: Page) => expect.poll(async () => (await stats(page))?.baked, { timeout: 30_000 }).toBe(180);

// Window scroll position for moment p of the run.
const scrollFor = (page: Page, p: number) =>
  page.evaluate((p) => {
    const run = document.querySelector('.run')!;
    const stage = document.querySelector<HTMLElement>('.stage')!;
    const r = run.getBoundingClientRect();
    const stick = parseFloat(getComputedStyle(stage).top) || 0;
    return r.top + scrollY - stick + p * (r.height - stage.clientHeight);
  }, p);

const progressNow = (page: Page) =>
  page.evaluate(() => {
    const run = document.querySelector('.run')!.getBoundingClientRect();
    const stage = document.querySelector('.stage')!.getBoundingClientRect();
    return (stage.top - run.top) / (run.height - stage.height);
  });

// paintFrame with a forced raster flush (Chromium records 2D calls and rasterises later), at the plate's size.
const paintMedian = (page: Page) =>
  page.evaluate(async () => {
    const imp = (p: string) => import(/* @vite-ignore */ p);
    const { paintFrame } = await imp('/src/lib/darkroom/paint.ts');
    const { buildScene } = await imp('/src/lib/darkroom/scene.ts');
    const { frameLayout } = await imp('/src/lib/darkroom/layout.ts');
    const { makeFilm } = await imp('/src/lib/darkroom/film.ts');
    const { pixelScale } = await imp('/src/lib/darkroom/scale.ts');
    const { readPalette } = await imp('/src/lib/darkroom/palette.ts');
    const stage = document.querySelector<HTMLElement>('.stage')!;
    const art = document.querySelector<HTMLElement>('.run__art')!.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const s = pixelScale(W, H, devicePixelRatio);
    const geo = { left: art.left - sr.left, top: art.top - sr.top, right: sr.right - art.right, bottom: sr.bottom - art.bottom };
    const scene = buildScene(frameLayout(W, H, W >= 760 ? 'wide' : 'narrow', geo));
    const film = makeFilm(scene, s);
    const c = document.createElement('canvas');
    c.width = Math.round(W * s);
    c.height = Math.round(H * s);
    const ctx = c.getContext('2d', { alpha: false })!;
    const pal = readPalette(stage);
    const ms: number[] = [];
    for (let k = 0; k < 45; k++) {
      const t = performance.now();
      ctx.setTransform(s, 0, 0, s, 0, 0);
      paintFrame(ctx, scene, k / 44, k, pal, film);
      ctx.getImageData(0, 0, 1, 1);
      ms.push(performance.now() - t);
    }
    ms.sort((a, b) => a - b);
    return ms[ms.length >> 1]!;
  });

test.describe('/dev/frames at 1440x900', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('budgets: first frame, first and last baked, blob bytes, decoded bitmaps, idle rAF', async ({ page }) => {
    await instrument(page);
    await open(page);
    await baked(page);
    const s = (await stats(page))!;
    expect(s.firstFrameMs!).toBeLessThanOrEqual(300);
    expect(s.firstLastMs!).toBeLessThanOrEqual(1500);
    expect(s.blobBytes).toBeLessThanOrEqual(40e6);
    expect(s.stores).toBe(1);

    // Scrub through the whole run: the LRU never holds more than eight decoded frames.
    for (const p of [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1, 0.5, 0]) {
      await page.evaluate((y) => window.scrollTo(0, y), await scrollFor(page, p));
      await page.waitForTimeout(250);
    }
    await page.waitForTimeout(1000);
    expect((await stats(page))!.peakDecoded).toBeLessThanOrEqual(8);
    expect((await stats(page))!.decoded).toBeLessThanOrEqual(8);

    // Idle: zero rAF callbacks over one second with no scroll.
    const before = await page.evaluate(() => (window as unknown as { __raf: number }).__raf);
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => (window as unknown as { __raf: number }).__raf)).toBe(before);
  });

  test('median paint at 1440x900 is at most 16 ms (Chromium)', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'the paint budget is set for Chromium');
    await open(page);
    expect(await paintMedian(page)).toBeLessThanOrEqual(16);
  });

  test('scrolling to each mark makes that stage current and shows its caption', async ({ page }) => {
    await open(page);
    const captions = page.getByRole('list', { name: 'The five stages' }).getByRole('listitem');
    for (let i = 0; i < MARKS.length; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), await scrollFor(page, MARKS[i]! + 0.01));
      const button = page.getByRole('button', { name: NAMES[i] });
      await expect(button).toHaveAttribute('aria-current', 'step');
      await expect(page.locator('.rail [aria-current="step"]')).toHaveCount(1);
      await expect(captions.nth(i)).toHaveClass(/is-on/);
      await expect(captions.nth(i)).toHaveCSS('opacity', '1');
      await expect(captions.nth(i)).toContainText(`Stage ${i + 1} of 5`);
    }
  });

  test('a rail button lands within 1% of its mark', async ({ page }) => {
    await open(page);
    await page.evaluate((y) => window.scrollTo(0, y), await scrollFor(page, 0.1));
    for (const i of [3, 1, 4]) {
      await page.getByRole('button', { name: NAMES[i] }).click();
      await page.waitForTimeout(1600);
      expect(Math.abs((await progressNow(page)) - MARKS[i]!)).toBeLessThanOrEqual(0.01);
      await expect(page.getByRole('button', { name: NAMES[i] })).toHaveAttribute('aria-current', 'step');
    }
  });

  test('a hidden document stops baking, and it resumes when visible', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    });
    await open(page);
    await page.waitForTimeout(500);
    const at = (await stats(page))!.baked;
    await page.waitForTimeout(1000);
    expect((await stats(page))!.baked).toBe(at);
    expect(at).toBeLessThan(180);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await baked(page);
  });

  test('navigating away and back three times leaves one store and no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    await open(page);
    for (let k = 0; k < 3; k++) {
      await page.getByRole('navigation', { name: /main|site|primary/i }).getByRole('link', { name: 'Atisha' }).click();
      await expect(page).toHaveURL(/\/atisha$/);
      await expect(page.locator('canvas.plate')).toHaveCount(0);
      await page.goBack();
      await expect(page).toHaveURL(/\/dev\/frames$/);
      await expect.poll(async () => (await stats(page))?.frames ?? 0).toBe(180);
    }
    await expect.poll(async () => (await stats(page))?.stores).toBe(1);
    expect(errors).toEqual([]);
  });

  test('no request leaves the origin', async ({ page, baseURL }) => {
    const foreign: string[] = [];
    const origin = new URL(baseURL!).origin;
    page.on('request', (r) => {
      const u = r.url();
      if (!u.startsWith(origin) && !u.startsWith('data:') && !u.startsWith('blob:')) foreign.push(u);
    });
    await open(page);
    await baked(page);
    expect(foreign).toEqual([]);
  });

  test('reduced motion: no blob URLs, no rAF loop, no plate, five painted stills', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await instrument(page);
    await page.goto('/dev/frames');
    const strip = page.getByRole('region', { name: 'Five stills of the method sequence' });
    await expect(strip.getByRole('img')).toHaveCount(5);
    await expect(page.locator('canvas.plate')).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Jump to a method stage' })).toHaveCount(0);
    // The stills paint (non-blank pixels) without animating.
    await expect
      .poll(() =>
        strip.locator('canvas').first().evaluate((c: HTMLCanvasElement) => {
          if (!c.width) return 0;
          const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
          let lit = 0;
          for (let i = 0; i < d.length; i += 4 * 97) if (d[i]! > 60) lit++;
          return lit;
        }),
      )
      .toBeGreaterThan(10);
    await page.waitForTimeout(1000);
    const counts = await page.evaluate(() => {
      const w = window as unknown as { __raf: number; __blobUrls: number };
      return { __raf: w.__raf, __blobUrls: w.__blobUrls };
    });
    expect(counts.__blobUrls).toBe(0);
    expect(counts.__raf).toBe(0);
  });
});

test.describe('/dev/frames at 390x844, DPR 3', () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true });

  test('median paint is at most 35 ms (Chromium), within 40 MB of blobs', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'the paint budget is set for Chromium');
    await open(page);
    expect(await paintMedian(page)).toBeLessThanOrEqual(35);
    await baked(page);
    expect((await stats(page))!.blobBytes).toBeLessThanOrEqual(40e6);
  });

  test('the rail runs across the top and stays inside the viewport', async ({ page }) => {
    await open(page);
    await page.evaluate((y) => window.scrollTo(0, y), await scrollFor(page, 0.3));
    const nav = page.getByRole('navigation', { name: 'Jump to a method stage' });
    await expect(nav.getByRole('button', { name: 'Digest' })).toHaveAttribute('aria-current', 'step');
    for (const b of await nav.getByRole('button').all()) {
      const box = (await b.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(390);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});

test('the runtime is a lazy chunk, out of the entry, at most 15 KB gzip with the components', async ({ browserName }) => {
  test.skip(browserName !== 'chromium', 'one build is enough');
  test.setTimeout(120_000);
  const root = process.cwd();
  const dir = mkdtempSync(join(tmpdir(), 'darkroom-chunk-'));
  try {
    // An entry that uses the run the way the homepage will, with React left out so the entry is our code only.
    const entry = join(dir, 'entry.ts');
    writeFileSync(
      entry,
      `import { ProcessSequence } from ${JSON.stringify(join(root, 'src/components/darkroom/ProcessSequence.tsx'))};\n` +
        `(globalThis as unknown as { run: unknown }).run = ProcessSequence;\n`,
    );
    const { build } = await import('vite');
    await build({
      root,
      configFile: join(root, 'vite.config.ts'),
      logLevel: 'silent',
      build: {
        outDir: join(dir, 'out'),
        emptyOutDir: true,
        manifest: true,
        rollupOptions: { input: entry, external: [/^react(\/|$)/, /^react-dom/, /^react-router/] },
      },
    });
    const manifest = JSON.parse(readFileSync(join(dir, 'out/.vite/manifest.json'), 'utf8')) as Record<
      string,
      { file: string; isEntry?: boolean; isDynamicEntry?: boolean; imports?: string[]; dynamicImports?: string[] }
    >;
    const key = Object.keys(manifest).find((k) => k.endsWith('src/lib/darkroom/index.ts'))!;
    expect(key, 'the runtime entry has its own chunk').toBeTruthy();
    const runtime = manifest[key]!;
    const entryChunk = Object.values(manifest).find((c) => c.isEntry)!;
    expect(runtime.isDynamicEntry).toBe(true);
    expect(entryChunk.imports ?? []).not.toContain(key);
    expect(entryChunk.dynamicImports ?? []).toContain(key);

    const gz = (file: string) => gzipSync(readFileSync(join(dir, 'out', file))).length;
    // The runtime and every chunk it pulls in that the entry does not.
    const seen = new Set<string>();
    const walk = (k: string) => {
      if (seen.has(k) || !manifest[k] || manifest[k]!.isEntry) return;
      seen.add(k);
      for (const i of manifest[k]!.imports ?? []) walk(i);
    };
    walk(key);
    const runtimeBytes = [...seen].reduce((n, k) => n + gz(manifest[k]!.file), 0);
    const componentBytes = gz(entryChunk.file);
    console.log(`darkroom runtime ${runtimeBytes} B gzip, components in the entry ${componentBytes} B gzip`);
    expect(runtimeBytes + componentBytes).toBeLessThanOrEqual(15 * 1024);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
