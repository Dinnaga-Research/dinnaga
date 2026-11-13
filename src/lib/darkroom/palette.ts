// ABOUTME: The frame palette (spec §3.4, §8.1): the frames are monochrome silver-gelatin, so the painter only
// ABOUTME: knows neutral Darkroom tokens, read from computed style; the stamp is the only colour, and it is DOM.

export type RGB = readonly [number, number, number];

export interface FramePalette {
  ground: RGB;
  rule: RGB;
  muted: RGB;
  text2: RGB;
  label: RGB;
  text: RGB;
  ink: RGB;
}

/** The token each palette slot reads. */
export const PALETTE_TOKENS: Record<keyof FramePalette, string> = {
  ground: '--dn-bg',
  rule: '--dn-rule',
  muted: '--dn-ui-muted',
  text2: '--dn-text-2',
  label: '--dn-text-label',
  text: '--dn-text',
  ink: '--dn-ink',
};

/** tokens.css values, used when a token is unset (a test checks they match). */
export const FALLBACK_PALETTE: FramePalette = {
  ground: [13, 12, 11],
  rule: [44, 41, 37],
  muted: [125, 118, 107],
  text2: [189, 181, 166],
  label: [163, 155, 140],
  text: [236, 228, 211],
  ink: [31, 27, 23],
};

export function parseColor(input: string): RGB | null {
  const s = input.trim();
  let m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
  if (m) {
    let h = m[1]!;
    if (h.length === 3) h = h.replace(/./g, (c) => c + c);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(s);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  return null;
}

export function readPalette(el: Element): FramePalette {
  const cs = getComputedStyle(el);
  const out = { ...FALLBACK_PALETTE };
  for (const key of Object.keys(PALETTE_TOKENS) as (keyof FramePalette)[]) {
    const c = parseColor(cs.getPropertyValue(PALETTE_TOKENS[key]));
    if (c) out[key] = c;
  }
  return out;
}

export const rgb = (c: RGB) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
export const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
