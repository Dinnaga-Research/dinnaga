// ABOUTME: The frame palette comes from the Darkroom tokens (spec §3.4, §8.1): read from computed style,
// ABOUTME: with a fallback equal to tokens.css; it holds no red.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FALLBACK_PALETTE, PALETTE_TOKENS, mix, parseColor, readPalette, rgb } from './palette';

const TOKENS = readFileSync(join(__dirname, '..', '..', 'styles', 'tokens.css'), 'utf8');
const tokenHex = (name: string) => new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, 'i').exec(TOKENS)?.[1];

describe('parseColor', () => {
  it('parses hex and rgb()', () => {
    expect(parseColor('#0d0c0b')).toEqual([13, 12, 11]);
    expect(parseColor(' #ECE4D3 ')).toEqual([236, 228, 211]);
    expect(parseColor('#fff')).toEqual([255, 255, 255]);
    expect(parseColor('rgb(1, 2, 3)')).toEqual([1, 2, 3]);
    expect(parseColor('rgba(1,2,3,0.5)')).toEqual([1, 2, 3]);
    expect(parseColor('')).toBeNull();
    expect(parseColor('var(--x)')).toBeNull();
  });
});

describe('FALLBACK_PALETTE', () => {
  it('equals the token values in tokens.css', () => {
    for (const [key, token] of Object.entries(PALETTE_TOKENS)) {
      const hex = tokenHex(token);
      expect(hex, token).toBeTruthy();
      expect(FALLBACK_PALETTE[key as keyof typeof PALETTE_TOKENS]).toEqual(parseColor(hex!));
    }
  });

  it('holds no red', () => {
    for (const c of Object.values(FALLBACK_PALETTE)) expect(c).not.toEqual([232, 73, 45]);
  });
});

describe('readPalette', () => {
  it('reads each --dn-* token from the element', () => {
    const el = document.createElement('div');
    el.style.setProperty('--dn-bg', '#010203');
    el.style.setProperty('--dn-text', '#fafafa');
    document.body.append(el);
    const p = readPalette(el);
    expect(p.ground).toEqual([1, 2, 3]);
    expect(p.text).toEqual([250, 250, 250]);
    expect(p.ink).toEqual(FALLBACK_PALETTE.ink);
    el.remove();
  });

  it('falls back when nothing is set', () => {
    const el = document.createElement('div');
    document.body.append(el);
    expect(readPalette(el)).toEqual(FALLBACK_PALETTE);
    el.remove();
  });
});

describe('colour helpers', () => {
  it('rgb() and mix()', () => {
    expect(rgb([13.7, 12, 11])).toBe('rgb(13,12,11)');
    expect(mix([0, 0, 0], [100, 200, 50], 0.5)).toEqual([50, 100, 25]);
  });
});
