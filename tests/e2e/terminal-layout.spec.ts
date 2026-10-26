// ABOUTME: Playwright checks for the Terminal box sizing across phone, tablet and desktop widths.
// ABOUTME: Guards the dropped 16:10 lock on phones, the 600px desktop minimum and the untouched middle band.
import { expect, test, type Page } from '@playwright/test';

async function boxHeight(page: Page) {
  const box = await page.locator('.terminal').boundingBox();
  return box?.height ?? 0;
}

test.describe('phone terminal layout', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('at 390x844 the terminal is at least 500px tall with no 16:10 aspect ratio', async ({
    page,
  }) => {
    await page.goto('/');
    expect(await boxHeight(page)).toBeGreaterThanOrEqual(500);
    const ratio = await page
      .locator('.terminal')
      .evaluate((el) => getComputedStyle(el).aspectRatio);
    expect(ratio).toBe('auto');
  });

  test('at 390x844 the screen fits at least 16 text rows after boot', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByLabel('Ask Dinnaga a question')).toBeVisible();
    const rows = await page.evaluate(() => {
      const screen = document.querySelector('.terminal-screen') as HTMLElement;
      const body = document.querySelector('.terminal-body') as HTMLElement;
      const cs = getComputedStyle(screen);
      const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const lh = parseFloat(getComputedStyle(body).lineHeight);
      return (screen.clientHeight - pad) / lh;
    });
    expect(rows).toBeGreaterThanOrEqual(16);
  });

  test('reduced motion does not change the phone layout', async ({ page }) => {
    await page.goto('/');
    const full = await boxHeight(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    expect(await boxHeight(page)).toBe(full);
  });
});

for (const vp of [
  { width: 390, height: 844 },
  { width: 375, height: 812 },
]) {
  test(`at ${vp.width}x${vp.height} every boot line and the prompt sit inside the screen`, async ({
    page,
  }) => {
    await page.setViewportSize(vp);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const input = page.getByLabel('Ask Dinnaga a question');
    await expect(input).toBeVisible();
    const screen = await page.locator('.terminal-screen').boundingBox();
    const lastLine = await page.locator('.terminal-body .t-line').last().boundingBox();
    const inputBox = await input.boundingBox();
    expect(screen && lastLine && inputBox).toBeTruthy();
    const screenBottom = screen!.y + screen!.height;
    expect(lastLine!.y + lastLine!.height).toBeLessThanOrEqual(screenBottom);
    expect(inputBox!.y + inputBox!.height).toBeLessThanOrEqual(screenBottom);
    const first = await page.locator('.terminal-body .t-line').first().boundingBox();
    expect(first!.y).toBeGreaterThanOrEqual(screen!.y);
  });
}

test('at 1440x900 the terminal is at least 600px tall', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  expect(await boxHeight(page)).toBeGreaterThanOrEqual(600);
});

test('at 768x1024 the terminal keeps the 16:10 ratio', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/');
  const box = await page.locator('.terminal').boundingBox();
  expect(box!.width / box!.height).toBeCloseTo(1.6, 1);
});
