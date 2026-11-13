// ABOUTME: Renders the share card (public/og.png) from scripts/og-template.html and the favicon set
// ABOUTME: (favicon.svg, favicon-32.png, apple-touch-icon.png, favicon.ico) from one tile drawing.
// Run: bun scripts/generate-og.ts (needs Playwright's Chromium: bunx playwright install chromium).
import { chromium, type Browser } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(new URL(import.meta.url).pathname), '..');
const PUBLIC = join(ROOT, 'public');

// Darkroom tokens (src/styles/tokens.css): --dn-bg and --dn-text.
const GROUND = '#0d0c0b';
const PAPER = '#ece4d3';

// The hexagon-D, as drawn in src/components/BrandMark.tsx (src/test/og.test.ts keeps them equal).
const HEXAGON = 'M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z';
const LETTER = 'M12 12 L12 28 L24 28 L28 24 L28 16 L24 12 Z M14 18 L24 18 L24 22 L14 22 Z';

/**
 * The mark in paper on a square ground tile, with explicit fills (no currentColor, which renders
 * black in a browser tab). `scale` shrinks the mark about the tile's centre, for the touch icon.
 */
function tileSvg(scale = 1): string {
  const offset = (20 * (1 - scale)).toFixed(2);
  const open = scale === 1 ? '' : `<g transform="translate(${offset} ${offset}) scale(${scale})">`;
  const close = scale === 1 ? '' : '</g>';
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">',
    `<rect width="40" height="40" fill="${GROUND}"/>`,
    open,
    `<path d="${HEXAGON}" fill="none" stroke="${PAPER}" stroke-width="1.5"/>`,
    `<path d="${LETTER}" fill="${PAPER}" fill-rule="evenodd"/>`,
    close,
    '</svg>',
    '',
  ].join('');
}

/** Wraps one PNG in an ICO container: ICONDIR (6 bytes) + one ICONDIRENTRY (16 bytes) + the PNG. */
function pngToIco(png: Buffer, size: number): Buffer {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image
  header.writeUInt8(size >= 256 ? 0 : size, 6); // width
  header.writeUInt8(size >= 256 ? 0 : size, 7); // height
  header.writeUInt8(0, 8); // no palette
  header.writeUInt8(0, 9); // reserved
  header.writeUInt16LE(1, 10); // colour planes
  header.writeUInt16LE(32, 12); // bits per pixel
  header.writeUInt32LE(png.length, 14); // image size
  header.writeUInt32LE(22, 18); // image offset
  return Buffer.concat([header, png]);
}

async function renderCard(browser: Browser): Promise<void> {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(`file://${join(ROOT, 'scripts', 'og-template.html')}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(
    () => document.fonts.check('800 96px Archivo') && [...document.fonts].every((f) => f.status === 'loaded'),
  );
  if (!loaded) throw new Error('Archivo did not load from public/fonts/archivo-var.woff2');
  await page.screenshot({ path: join(PUBLIC, 'og.png') });
  await page.close();
}

async function renderTile(browser: Browser, svg: string, size: number): Promise<Buffer> {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  const sized = svg.replace('width="40" height="40"', `width="${size}" height="${size}"`);
  await page.setContent(`<style>*{margin:0}svg{display:block}</style>${sized}`);
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: size, height: size } });
  await page.close();
  return png;
}

async function main(): Promise<void> {
  const favicon = tileSvg();
  writeFileSync(join(PUBLIC, 'favicon.svg'), favicon);

  const browser = await chromium.launch();
  try {
    await renderCard(browser);
    const png32 = await renderTile(browser, favicon, 32);
    writeFileSync(join(PUBLIC, 'favicon-32.png'), png32);
    writeFileSync(join(PUBLIC, 'favicon.ico'), pngToIco(png32, 32));
    // iOS masks the touch icon's corners and shows it large, so the mark gets a margin there.
    writeFileSync(join(PUBLIC, 'apple-touch-icon.png'), await renderTile(browser, tileSvg(0.72), 180));
  } finally {
    await browser.close();
  }
  for (const f of ['og.png', 'favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'favicon.ico']) {
    console.log(`Generated public/${f}`);
  }
}

main().catch((err) => {
  console.error('Failed to generate the share card and icons:', err);
  process.exit(1);
});
