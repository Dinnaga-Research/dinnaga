// ABOUTME: Playwright checks for the Cromulon plasma-ASCII art behind the Terminal text.
// ABOUTME: Covers layer attributes, pixels, text contrast knockouts, hiding, a11y and re-layout on resize.
import { expect, test, type Page } from '@playwright/test';

const ART = '.terminal-screen canvas.cromulon-art';

interface Mass {
  total: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  belowY: number;
  inRect: number;
}

/** Wait for fonts and a drawn (non-empty) canvas. */
async function waitForArt(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(
      () =>
        page.locator(ART).evaluate((c: HTMLCanvasElement) => {
          const ctx = c.getContext('2d')!;
          const d = ctx.getImageData(0, 0, c.width, c.height).data;
          for (let i = 3; i < d.length; i += 4) if (d[i]! > 0) return true;
          return false;
        }),
      { timeout: 15_000 },
    )
    .toBe(true);
}

/** Alpha mass by region. `belowCss` is a CSS-pixel y (page coords); `rect` a CSS page rect. */
async function alphaMass(
  page: Page,
  belowCss = Infinity,
  rect: { x: number; y: number; width: number; height: number } | null = null,
): Promise<Mass> {
  return page.locator(ART).evaluate(
    (c: HTMLCanvasElement, args) => {
      const box = c.getBoundingClientRect();
      const sx = c.width / box.width;
      const sy = c.height / box.height;
      const ctx = c.getContext('2d')!;
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      const m = { total: 0, left: 0, right: 0, top: 0, bottom: 0, belowY: 0, inRect: 0 };
      for (let y = 0; y < c.height; y++) {
        for (let x = 0; x < c.width; x++) {
          const a = d[(y * c.width + x) * 4 + 3]!;
          if (!a) continue;
          m.total += a;
          if (x < c.width / 2) m.left += a; else m.right += a;
          if (y < c.height / 2) m.top += a; else m.bottom += a;
          const px = box.left + x / sx;
          const py = box.top + y / sy;
          if (py > args.below) m.belowY += a;
          if (
            args.rect &&
            px >= args.rect.x && px <= args.rect.x + args.rect.width &&
            py >= args.rect.y && py <= args.rect.y + args.rect.height
          ) m.inRect += a;
        }
      }
      return m;
    },
    { below: belowCss, rect },
  );
}

test.describe('desktop 1440x900, reduced motion', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByLabel('Ask Dinnaga a question')).toBeVisible();
    await waitForArt(page);
  });

  test('art canvas is aria-hidden, 0.3 opacity, z-index 1, with pixels in the lower right', async ({ page }) => {
    const art = page.locator(ART);
    await expect(art).toHaveCount(1);
    await expect(art).toHaveAttribute('aria-hidden', 'true');
    const style = await art.evaluate((c) => {
      const s = getComputedStyle(c);
      return { opacity: s.opacity, z: s.zIndex, pe: s.pointerEvents, pos: s.position };
    });
    expect(style).toEqual({ opacity: '0.3', z: '1', pe: 'none', pos: 'absolute' });

    const lowerRight = await art.evaluate((c: HTMLCanvasElement) => {
      const d = c.getContext('2d')!.getImageData(c.width >> 1, c.height >> 1, c.width >> 1, c.height >> 1).data;
      let sum = 0;
      for (let i = 3; i < d.length; i += 4) sum += d[i]!;
      return sum;
    });
    expect(lowerRight).toBeGreaterThan(0);
  });

  test('text contrast is unchanged: boot line and prompt are byte-identical with the art hidden', async ({ page }) => {
    const shoot = async (selector: string) => {
      const box = (await page.locator(selector).first().boundingBox())!;
      return page.screenshot({ clip: box });
    };
    for (const selector of ['.t-line', '.t-prompt']) {
      const withArt = await shoot(selector);
      await page.locator(ART).evaluate((c) => ((c as HTMLElement).style.display = 'none'));
      const without = await shoot(selector);
      await page.locator(ART).evaluate((c) => ((c as HTMLElement).style.display = ''));
      expect(withArt.equals(without), `${selector} pixels differ with the art shown`).toBe(true);
    }
  });

  test('the knockout test is meaningful: the art reaches behind the prompt row', async ({ page }) => {
    const box = (await page.locator('.t-prompt').first().boundingBox())!;
    const m = await alphaMass(page, Infinity, box);
    expect(m.inRect).toBeGreaterThan(0);
  });

  test('forced colours hides the art', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
    await expect(page.locator(ART)).toBeHidden();
    expect(await page.locator(ART).evaluate((c) => getComputedStyle(c).display)).toBe('none');
  });

  test('more contrast hides the art', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce', contrast: 'more' });
    expect(await page.locator(ART).evaluate((c) => getComputedStyle(c).display)).toBe('none');
  });

  test('the art adds no names, roles or text to the accessibility tree', async ({ page }) => {
    const terminal = page.locator('.terminal');
    await expect(terminal.getByRole('img')).toHaveCount(0);
    const snap = await terminal.ariaSnapshot();
    expect(snap).not.toMatch(/img|canvas|cromulon/i);
    await expect(page.locator(ART)).toHaveText('');
    await expect(page.locator(ART)).toHaveAttribute('aria-hidden', 'true');
  });

  test('resizing 1440 to 390 re-lays out the art: no stretch and the face stays lower right', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(
        () =>
          page.locator(ART).evaluate((c: HTMLCanvasElement) => {
            const screen = c.parentElement!;
            const dpr = devicePixelRatio || 1;
            return Math.abs(c.width - Math.round(screen.clientWidth * dpr)) <= 1 &&
              Math.abs(c.height - Math.round(screen.clientHeight * dpr)) <= 1;
          }),
        { timeout: 10_000 },
      )
      .toBe(true);
    const sized = await page.locator(ART).evaluate((c: HTMLCanvasElement) => ({
      ratio: c.width / c.height,
      cssRatio: c.getBoundingClientRect().width / c.getBoundingClientRect().height,
    }));
    expect(Math.abs(sized.ratio - sized.cssRatio)).toBeLessThan(0.02);
    await waitForArt(page);
    const m = await alphaMass(page);
    expect(m.right).toBeGreaterThan(m.left);
    expect(m.bottom).toBeGreaterThan(m.top);
  });
});

test.describe('phone 390x844, reduced motion', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the face shows below the prompt', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByLabel('Ask Dinnaga a question')).toBeVisible();
    await waitForArt(page);
    const prompt = (await page.locator('.t-prompt').first().boundingBox())!;
    const m = await alphaMass(page, prompt.y + prompt.height);
    expect(m.belowY).toBeGreaterThan(0);
  });
});

// ── Motion (full motion unless a test says otherwise) ─────────────────────────────────

const dataUrl = (page: Page) => page.locator(ART).evaluate((c: HTMLCanvasElement) => c.toDataURL());
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Sleep until `ms` after `t0` (a Date.now() taken before navigation). */
const sleepUntil = (t0: number, ms: number) => sleep(Math.max(0, t0 + ms - Date.now()));

async function loadFullMotion(page: Page) {
  const t0 = Date.now();
  await page.goto('/');
  await waitForArt(page);
  return t0;
}

async function differsWithin(page: Page, before: string, timeout = 2000) {
  await expect.poll(async () => (await dataUrl(page)) !== before, { timeout }).toBe(true);
}

test.describe('motion 1440x900, full motion', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('flows for the first seconds, then holds still', async ({ page }) => {
    const t0 = await loadFullMotion(page);
    const a = await dataUrl(page);
    await sleep(300);
    const b = await dataUrl(page);
    expect(b).not.toBe(a);

    await sleepUntil(t0, 7000);
    const c = await dataUrl(page);
    await sleep(500);
    expect(await dataUrl(page)).toBe(c);
  });

  test('hovering the Terminal makes it flow again after settling', async ({ page }) => {
    const t0 = await loadFullMotion(page);
    await page.mouse.move(2, 2);
    await sleepUntil(t0, 7000);
    const settled = await dataUrl(page);
    await sleep(300);
    expect(await dataUrl(page)).toBe(settled);
    const box = (await page.locator('.terminal').boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
    await differsWithin(page, settled);
  });

  test('typing a character makes it flow again after settling', async ({ page }) => {
    const t0 = await loadFullMotion(page);
    await page.mouse.move(2, 2);
    await sleepUntil(t0, 7000);
    const settled = await dataUrl(page);
    const input = page.getByLabel('Ask Dinnaga a question');
    await expect(input).toBeVisible();
    await input.focus();
    await input.press('a');
    await differsWithin(page, settled);
    // and it keeps flowing, not just one swapped frame
    const mid = await dataUrl(page);
    await sleep(400);
    expect(await dataUrl(page)).not.toBe(mid);
  });

  test('does not animate while scrolled out of view', async ({ page }) => {
    await loadFullMotion(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect
      .poll(() => page.locator('.terminal').evaluate((el) => el.getBoundingClientRect().bottom < 0))
      .toBe(true);
    await sleep(500); // let the IntersectionObserver report and any in-flight frame land
    const a = await dataUrl(page);
    await sleep(500);
    expect(await dataUrl(page)).toBe(a);
  });

  test('text contrast is unchanged with the art at rest (settled, full motion)', async ({ page }) => {
    const t0 = await loadFullMotion(page);
    await page.mouse.move(2, 2);
    await expect(page.getByLabel('Ask Dinnaga a question')).toBeVisible();
    await sleepUntil(t0, 7000);
    for (const selector of ['.t-line', '.t-prompt']) {
      const box = (await page.locator(selector).first().boundingBox())!;
      // Freeze CSS animations (cursor blink, CRT flicker) so only the art can differ between shots.
      const withArt = await page.screenshot({ clip: box, animations: 'disabled' });
      await page.locator(ART).evaluate((c) => ((c as HTMLElement).style.display = 'none'));
      const without = await page.screenshot({ clip: box, animations: 'disabled' });
      await page.locator(ART).evaluate((c) => ((c as HTMLElement).style.display = ''));
      expect(withArt.equals(without), `${selector} pixels differ with the art shown`).toBe(true);
    }
  });

  test('makes no rAF callbacks while settled', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __raf: number };
      w.__raf = 0;
      const orig = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (cb) => {
        w.__raf++;
        return orig(cb);
      };
    });
    const t0 = await loadFullMotion(page);
    await page.mouse.move(2, 2);
    const count = () => page.evaluate(() => (window as unknown as { __raf: number }).__raf);
    await sleepUntil(t0, 7000);
    const a = await count();
    expect(a).toBeGreaterThan(0); // the loop did run before settling
    await sleep(1000);
    expect(await count()).toBe(a);
  });

  test('unlock brightens the art to 0.75 and flows again before routing', async ({ page }) => {
    const t0 = await loadFullMotion(page);
    await page.mouse.move(2, 2);
    await sleepUntil(t0, 7000); // settled
    const input = page.getByLabel('Ask Dinnaga a question');
    await input.fill('show me what you got');
    await input.press('Enter');
    await expect
      .poll(() => page.locator(ART).evaluate((c) => getComputedStyle(c).opacity), { timeout: 5000 })
      .toBe('0.75');
    expect(new URL(page.url()).pathname).toBe('/');
    const a = await dataUrl(page);
    await sleep(300);
    expect(await dataUrl(page)).not.toBe(a);
    await expect(page).toHaveURL(/\/artifacts/);
  });
});

test.describe('motion 1440x900, reduced motion', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('is fully static and typing does not change the canvas', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const t0 = Date.now();
    await page.goto('/');
    await waitForArt(page);
    const a = await dataUrl(page);
    await sleepUntil(t0, 2000);
    expect(await dataUrl(page)).toBe(a);
    await sleepUntil(t0, 6000);
    expect(await dataUrl(page)).toBe(a);
    const input = page.getByLabel('Ask Dinnaga a question');
    await input.focus();
    await input.pressSequentially('abc');
    await sleep(500);
    expect(await dataUrl(page)).toBe(a);
  });

  test('unlock jumps straight to 0.75 opacity without a loop', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await waitForArt(page);
    const input = page.getByLabel('Ask Dinnaga a question');
    await expect(input).toBeVisible();
    const before = await dataUrl(page);
    await input.fill('show me what you got');
    await input.press('Enter');
    await expect
      .poll(() => page.locator(ART).evaluate((c) => getComputedStyle(c).opacity), { timeout: 1500 })
      .toBe('0.75');
    expect(await dataUrl(page)).toBe(before);
  });
});
