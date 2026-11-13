// ABOUTME: Share card and favicon set (#72 under the Darkroom spec): output sizes, ICO header, card
// ABOUTME: template copy and colour bans, explicit favicon fills, the mark's geometry, and the head tags.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..', '..');
const read = (...p: string[]) => readFileSync(join(ROOT, ...p));
const text = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

const TEMPLATE = () => text('scripts', 'og-template.html');
const FAVICON = () => text('public', 'favicon.svg');

/** Width and height from a PNG's IHDR chunk (big-endian at offsets 16 and 20). */
function pngSize(buf: Buffer): [number, number] {
  expect(buf.subarray(0, 8).toString('hex'), 'PNG signature').toBe('89504e470d0a1a0a');
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

/** The two path `d` attributes of the hexagon-D, whitespace-normalised. */
function markPaths(src: string): string[] {
  return [...src.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]!.replace(/\s+/g, ' ').trim());
}

describe('generated images', () => {
  it('og.png is 1200×630', () => {
    expect(pngSize(read('public', 'og.png'))).toEqual([1200, 630]);
  });

  it('favicon-32.png is 32×32', () => {
    expect(pngSize(read('public', 'favicon-32.png'))).toEqual([32, 32]);
  });

  it('apple-touch-icon.png is 180×180', () => {
    expect(pngSize(read('public', 'apple-touch-icon.png'))).toEqual([180, 180]);
  });

  it('favicon.ico is one 32×32 PNG in an ICO header', () => {
    const ico = read('public', 'favicon.ico');
    expect(ico.subarray(0, 4).toString('hex')).toBe('00000100');
    expect(ico.readUInt16LE(4)).toBe(1); // one image
    expect(ico[6]).toBe(32);
    expect(ico[7]).toBe(32);
    const size = ico.readUInt32LE(14);
    const offset = ico.readUInt32LE(18);
    expect(offset).toBe(22);
    expect(offset + size).toBe(ico.length);
    expect(pngSize(ico.subarray(offset))).toEqual([32, 32]);
  });
});

describe('card template', () => {
  it('carries the headline and the domain', () => {
    expect(TEMPLATE()).toContain('Living documents for engineers who code with AI');
    expect(TEMPLATE()).toContain('dinnaga.ai');
    expect(TEMPLATE()).toContain('Dinnaga Research');
  });

  it('has no lime and no red', () => {
    const t = TEMPLATE();
    expect(t).not.toMatch(/c0fe04/i);
    expect(t).not.toMatch(/192,\s*254,\s*4/);
    expect(t).not.toMatch(/e8492d/i);
    expect(t).not.toMatch(/232,\s*73,\s*45/);
  });

  it('has none of the banned words', () => {
    for (const word of ['anonymous', 'validate', 'openly', 'genuinely', 'live']) {
      expect(TEMPLATE(), word).not.toMatch(new RegExp(`\\b${word}\\b`, 'i'));
    }
  });

  it('uses the Darkroom ground, paper and label colours, with no glow or gradient', () => {
    const t = TEMPLATE();
    expect(t).toMatch(/#0d0c0b/i);
    expect(t).toMatch(/#ece4d3/i);
    expect(t).toMatch(/#a39b8c/i);
    expect(t).not.toMatch(/gradient|box-shadow|text-shadow|filter:/i);
  });

  it('loads Archivo from the site files only', () => {
    const t = TEMPLATE();
    expect(t).toContain('../public/fonts/archivo-var.woff2');
    expect(t).not.toMatch(/fonts\.googleapis|JetBrains|Departure|Marathon/i);
  });
});

describe('favicon.svg', () => {
  it('has explicit fills: no currentColor, no lime, no red', () => {
    const svg = FAVICON();
    expect(svg).not.toMatch(/currentColor/i);
    expect(svg).not.toMatch(/c0fe04|d4ff00|192,\s*254,\s*4/i);
    expect(svg).not.toMatch(/e8492d|232,\s*73,\s*45/i);
  });

  it('draws the mark in paper on a square ground tile', () => {
    const svg = FAVICON();
    expect(svg).toMatch(/<rect[^>]*width="40"[^>]*height="40"[^>]*fill="#0d0c0b"/i);
    expect(svg).not.toMatch(/\brx=|\bry=/);
    expect(svg).toMatch(/stroke="#ece4d3"/i);
    expect(svg).toMatch(/fill="#ece4d3"/i);
  });

  it('keeps the brand mark geometry exactly (template, favicon and BrandMark agree)', () => {
    const brand = markPaths(text('src', 'components', 'BrandMark.tsx'));
    expect(brand).toHaveLength(2);
    expect(markPaths(FAVICON())).toEqual(brand);
    expect(markPaths(TEMPLATE())).toEqual(brand);
  });
});

describe('index.html share and icon tags', () => {
  const html = () => text('index.html');
  const one = (attr: 'property' | 'name', key: string) => {
    const re = new RegExp(`<meta\\s+${attr}="${key}"\\s+content="([^"]*)"`, 'g');
    const hits = [...html().matchAll(re)];
    expect(hits, key).toHaveLength(1);
    return hits[0]![1];
  };

  it('has exactly one of each share tag with the approved values', () => {
    expect(one('property', 'og:title')).toBe('Dinnaga Research');
    expect(one('property', 'og:site_name')).toBe('Dinnaga Research');
    expect(one('property', 'og:image')).toBe('https://dinnaga.ai/og.png');
    expect(one('property', 'og:image:alt')).toBe('Dinnaga Research: Living documents for engineers who code with AI');
    expect(one('name', 'twitter:image')).toBe('https://dinnaga.ai/og.png');
    expect(one('property', 'og:image:width')).toBe('1200');
    expect(one('property', 'og:image:height')).toBe('630');
  });

  it('links the three icon files', () => {
    const h = html();
    expect(h).toContain('<link rel="icon" type="image/svg+xml" href="/favicon.svg" />');
    expect(h).toContain('<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />');
    expect(h).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png" />');
  });
});
