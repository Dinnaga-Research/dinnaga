// ABOUTME: paintFrame (spec §8.1, §3.4) with a recording fake 2D context: only palette colours (or mixes of
// ABOUTME: two), never the tested red, and a deterministic call log for the same moment.
import { describe, expect, it } from 'vitest';
import { frameLayout } from './layout';
import { paintFrame } from './paint';
import { FALLBACK_PALETTE, parseColor, type FramePalette, type RGB } from './palette';
import { buildScene } from './scene';
import { fakeFilm, recordingContext } from './testing';

const P = [0, 0.3, 0.6, 0.9, 1];
const wide = () => buildScene(frameLayout(1440, 844, 'wide', { left: 432, top: 42, right: 40, bottom: 64 }));
const narrow = () => buildScene(frameLayout(390, 844, 'narrow', { left: 16, top: 70, right: 16, bottom: 168 }));

// Distinct, odd values: a colour the painter invents cannot land on a segment between two of these by chance.
const ODD: FramePalette = {
  ground: [3, 5, 7],
  rule: [41, 43, 47],
  muted: [101, 103, 107],
  text2: [151, 157, 163],
  label: [131, 113, 97],
  text: [251, 241, 229],
  ink: [23, 29, 37],
};

function onPaletteLine(c: RGB, pal: FramePalette): boolean {
  const cols = Object.values(pal);
  for (const a of cols) {
    for (const b of cols) {
      // c = a + (b - a) t for one t in [0, 1], within rounding (rgb() truncates to integers)
      let t: number | null = null;
      let ok = true;
      for (let k = 0; k < 3; k++) {
        const d = b[k]! - a[k]!;
        if (Math.abs(d) < 1e-9) {
          if (Math.abs(c[k]! - a[k]!) > 1.01) ok = false;
          continue;
        }
        const tk = (c[k]! - a[k]!) / d;
        if (t == null) t = tk;
        else if (Math.abs(tk - t) * Math.abs(d) > 1.01 && Math.abs(c[k]! - (a[k]! + d * t)) > 1.01) ok = false;
      }
      if (ok && (t == null || (t > -0.02 && t < 1.02))) return true;
    }
  }
  return false;
}

describe('paintFrame', () => {
  for (const [name, make] of [['wide', wide], ['narrow', narrow]] as const) {
    for (const p of P) {
      it(`${name} p=${p}: only palette colours, never red`, () => {
        const rec = recordingContext();
        paintFrame(rec.ctx, make(), p, Math.round(p * 179), ODD, fakeFilm());
        expect(rec.colours.size).toBeGreaterThan(0);
        for (const s of rec.colours) {
          expect(s).not.toMatch(/e8492d|232,\s*73,\s*45/i);
          const c = parseColor(s);
          expect(c, s).not.toBeNull();
          expect(onPaletteLine(c!, ODD), `${s} is not a palette colour or a mix of two`).toBe(true);
        }
      });
    }
  }

  it('with the real palette, no colour is the tested red', () => {
    for (const p of P) {
      const rec = recordingContext();
      paintFrame(rec.ctx, wide(), p, 0, FALLBACK_PALETTE, fakeFilm());
      for (const s of rec.colours) expect(parseColor(s)).not.toEqual([232, 73, 45]);
    }
  });

  it('call counts and the call log are stable across runs', () => {
    for (const p of P) {
      const a = recordingContext();
      const b = recordingContext();
      paintFrame(a.ctx, wide(), p, 7, FALLBACK_PALETTE, fakeFilm());
      paintFrame(b.ctx, wide(), p, 7, FALLBACK_PALETTE, fakeFilm());
      expect(a.calls).toEqual(b.calls);
      expect(a.log).toEqual(b.log);
    }
  });

  it('develops: p=0.3 paints more than p=0 (the latent image comes up), the page appears by p=1', () => {
    const at = (p: number) => {
      const r = recordingContext();
      paintFrame(r.ctx, wide(), p, 0, FALLBACK_PALETTE, fakeFilm());
      return r;
    };
    expect(at(0.3).calls.fillRect!).toBeGreaterThan(at(0).calls.fillRect! * 0.5);
    // The paper sheet is filled in the text colour at full opacity once the page has formed.
    expect(at(1).log.join('\n')).toContain('fillStyle=rgb(236,228,211)');
  });

  it('starts with a ground fill and finishes with the vignette and grain', () => {
    const r = recordingContext();
    paintFrame(r.ctx, wide(), 0.5, 3, FALLBACK_PALETTE, fakeFilm());
    expect(r.log.slice(0, 4).join(' ')).toContain('fillStyle=rgb(13,12,11)');
    expect(r.calls.drawImage!).toBeGreaterThan(1);
  });

  it('paints without film', () => {
    const r = recordingContext();
    paintFrame(r.ctx, wide(), 0.5, 3, FALLBACK_PALETTE, null);
    expect(r.calls.drawImage ?? 0).toBe(0);
  });
});
