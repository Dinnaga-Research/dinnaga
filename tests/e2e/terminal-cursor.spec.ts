// ABOUTME: Playwright checks for the Terminal's single block cursor and its placement.
// ABOUTME: Covers the insertion-point tracking, the boot-typing cursor and the steady cursor under reduced motion.
import { expect, test } from '@playwright/test';

test.describe('insertion-point cursor', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('follows typing, ArrowLeft and End at about one character advance each', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const input = page.getByLabel('Ask Dinnaga a question');
    await expect(input).toBeVisible();
    await input.focus();
    await input.pressSequentially('abc');

    const cursor = page.locator('.t-cursor');
    await expect(cursor).toHaveCount(1);
    const inputLeft = (await input.boundingBox())!.x;
    const mirror = (await page.locator('.t-mirror').boundingBox())!;
    const advance = mirror.width / 3;
    expect(advance).toBeGreaterThan(4);

    const offset = async () => (await cursor.boundingBox())!.x - inputLeft;
    expect(Math.abs((await offset()) - 3 * advance)).toBeLessThanOrEqual(2);

    await input.press('ArrowLeft');
    await input.press('ArrowLeft');
    await expect.poll(async () => Math.abs((await offset()) - advance)).toBeLessThanOrEqual(2);

    // End moves the caret on Linux/Windows; on macOS the line-end chord is Cmd+Right.
    await input.press('End');
    await input.press('ControlOrMeta+ArrowRight');
    await expect
      .poll(async () => Math.abs((await offset()) - 3 * advance))
      .toBeLessThanOrEqual(2);
  });

  test('sits at the left edge, clear of the placeholder, with an empty field', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const input = page.getByLabel('Ask Dinnaga a question');
    await expect(input).toBeVisible();
    await expect(page.locator('.t-cursor')).toHaveCount(1);
    const cursor = (await page.locator('.t-cursor').boundingBox())!;
    const ph = (await page.locator('.t-placeholder').boundingBox())!;
    expect(cursor.x + cursor.width).toBeLessThanOrEqual(ph.x + 0.5);
  });
});

test('at 390px there is one cursor and it does not overlap the placeholder', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByLabel('Ask Dinnaga a question')).toBeVisible();
  await expect(page.locator('.t-cursor')).toHaveCount(1);
  const cursor = (await page.locator('.t-cursor').boundingBox())!;
  const ph = (await page.locator('.t-placeholder').boundingBox())!;
  expect(cursor.x + cursor.width).toBeLessThanOrEqual(ph.x + 0.5);
});

test('while boot is typing, the cursor trails the line being typed', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const cursor = page.locator('.t-cursor');
  await expect(page.locator('.terminal-body .t-line').first()).toContainText('dinnaga');
  let checked = 0;
  for (let i = 0; i < 6; i++) {
    const info = await page.evaluate(() => {
      const cur = document.querySelector('.terminal-body .t-line .t-cursor');
      if (!cur) return null;
      const line = cur.closest('.t-line') as HTMLElement;
      const lr = line.getBoundingClientRect();
      const cr = cur.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(line);
      range.setEndBefore(cur);
      const rects = range.getClientRects();
      const last = rects[rects.length - 1];
      return {
        top: cr.top,
        left: cr.left,
        lineTop: lr.top,
        lineBottom: lr.bottom,
        textRight: last ? last.right : 0,
      };
    });
    if (info) {
      expect(info.top).toBeGreaterThanOrEqual(info.lineTop - 0.5);
      expect(info.top).toBeLessThanOrEqual(info.lineBottom);
      expect(info.left).toBeGreaterThanOrEqual(info.textRight - 0.5);
      checked++;
    }
    await page.waitForTimeout(150);
  }
  expect(checked).toBeGreaterThan(0);
  await expect(cursor).toHaveCount(1);
});

test('under reduced motion the cursor is steady', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByLabel('Ask Dinnaga a question')).toBeVisible();
  const cursor = page.locator('.t-cursor');
  await expect(cursor).toHaveCount(1);
  const sample = () =>
    cursor.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { name: cs.animationName, opacity: cs.opacity };
    });
  const a = await sample();
  expect(a.name).toBe('none');
  expect(a.opacity).toBe('1');
  await page.waitForTimeout(600);
  const b = await sample();
  expect(b.name).toBe('none');
  expect(b.opacity).toBe('1');
});

test('the old glyph cursor and uppercase placeholder are gone', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByLabel('Ask Dinnaga a question')).toBeVisible();
  const text = await page.locator('.terminal').innerText();
  expect(text).not.toContain('▮');
  expect(text).not.toContain('ASK A QUESTION_');
  expect(text).toContain('ask a question');
});
