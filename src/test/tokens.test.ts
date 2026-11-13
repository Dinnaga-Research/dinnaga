// ABOUTME: Darkroom token checks (spec 2026-11-12-darkroom.md §3, §4.3, §9.1, §10): exact values,
// ABOUTME: WCAG contrast to two decimals, the root clamp, the doc tokens, and no retired --dn-term-* or lime value.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..', '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) throw new Error(`Invalid hex colour: ${hex}`);
  return [parseInt(m[1]!, 16), parseInt(m[2]!, 16), parseInt(m[3]!, 16)];
}

function luminance([r, g, b]: [number, number, number]): number {
  const lin = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!;
}

function contrast(a: string, b: string): number {
  const la = luminance(hexToRgb(a));
  const lb = luminance(hexToRgb(b));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Composite `fg` at `alpha` over the opaque `bg`. */
function blend(fg: string, alpha: number, bg: string): string {
  const a = hexToRgb(fg);
  const b = hexToRgb(bg);
  return '#' + a.map((c, i) => Math.round(c * alpha + b[i]! * (1 - alpha)).toString(16).padStart(2, '0')).join('');
}

const tokensCss = read('src/styles/tokens.css');

/** Every `--name: value;` in tokens.css (first definition wins; media overrides are checked separately). */
function declarations(css: string, prefix: string): Map<string, string> {
  const out = new Map<string, string>();
  const re = new RegExp(`(${prefix}[a-z0-9-]+)\\s*:\\s*([^;]+);`, 'g');
  for (const m of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(re)) {
    if (!out.has(m[1]!)) out.set(m[1]!, m[2]!.trim());
  }
  return out;
}

const dn = declarations(tokensCss, '--dn-');
const hex = (name: string): string => {
  const v = dn.get(name);
  if (!v || !/^#[0-9a-f]{6}$/i.test(v)) throw new Error(`${name} is not a hex token (${v})`);
  return v.toLowerCase();
};

describe('colour tokens (§3)', () => {
  it('carry the §3 values', () => {
    expect({
      bg: hex('--dn-bg'),
      raised: hex('--dn-bg-raised'),
      raised2: hex('--dn-bg-raised-2'),
      rule: hex('--dn-rule'),
      ruleStrong: hex('--dn-rule-strong'),
      uiMuted: hex('--dn-ui-muted'),
      ink: hex('--dn-ink'),
      text: hex('--dn-text'),
      text2: hex('--dn-text-2'),
      label: hex('--dn-text-label'),
      tested: hex('--dn-tested'),
      focus: hex('--dn-focus'),
      selBg: hex('--dn-selection-bg'),
      selText: hex('--dn-selection-text'),
    }).toEqual({
      bg: '#0d0c0b',
      raised: '#151311',
      raised2: '#1d1a17',
      rule: '#2c2925',
      ruleStrong: '#4a453e',
      uiMuted: '#7d766b',
      ink: '#1f1b17',
      text: '#ece4d3',
      text2: '#bdb5a6',
      label: '#a39b8c',
      tested: '#e8492d',
      focus: '#ece4d3',
      selBg: '#ece4d3',
      selText: '#0d0c0b',
    });
  });

  it('meet the §3.2 text ratios, to two decimals', () => {
    const grounds = ['--dn-bg', '--dn-bg-raised', '--dn-bg-raised-2'];
    const table: Record<string, number[]> = {
      '--dn-text': [15.45, 14.65, 13.7],
      '--dn-text-2': [9.61, 9.11, 8.52],
      '--dn-text-label': [7.1, 6.73, 6.29],
    };
    for (const [token, ratios] of Object.entries(table)) {
      expect(grounds.map((g) => round2(contrast(hex(token), hex(g)))), token).toEqual(ratios);
    }
  });

  it('meet the floors: text, secondary, label, tested, focus, non-text marks', () => {
    expect(contrast(hex('--dn-text'), hex('--dn-bg'))).toBeGreaterThanOrEqual(15);
    expect(contrast(hex('--dn-text'), hex('--dn-bg-raised'))).toBeGreaterThanOrEqual(14.5);
    expect(contrast(hex('--dn-text-2'), hex('--dn-bg'))).toBeGreaterThanOrEqual(9);
    expect(contrast(hex('--dn-text-2'), hex('--dn-bg-raised'))).toBeGreaterThanOrEqual(9);
    expect(contrast(hex('--dn-text-label'), hex('--dn-bg'))).toBeGreaterThanOrEqual(7);
    expect(round2(contrast(hex('--dn-tested'), hex('--dn-bg')))).toBe(5.05);
    expect(round2(contrast(hex('--dn-tested'), hex('--dn-bg-raised')))).toBe(4.79);
    expect(contrast(hex('--dn-tested'), hex('--dn-bg'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(hex('--dn-tested'), hex('--dn-bg-raised'))).toBeGreaterThanOrEqual(3);
    expect(contrast(hex('--dn-focus'), hex('--dn-bg'))).toBeGreaterThanOrEqual(3);
    expect(round2(contrast(hex('--dn-ui-muted'), hex('--dn-bg')))).toBe(4.35);
    expect(contrast(hex('--dn-selection-text'), hex('--dn-selection-bg'))).toBeGreaterThanOrEqual(15);
  });

  it('has no --dn-term-* token and no lime anywhere in the stylesheets', () => {
    expect(tokensCss).not.toMatch(/--dn-term-/);
    for (const css of cssFiles().map((f) => readFileSync(f, 'utf8'))) {
      expect(css).not.toMatch(/c0fe04|192,\s*254,\s*4\b/i);
    }
  });
});

describe('type, layout and motion tokens (§4.2-§6)', () => {
  it('declares the stacks of §4.2', () => {
    expect(dn.get('--dn-font-site')).toBe('"Archivo", "Noto Sans", "Helvetica Neue", Arial, sans-serif');
  });

  it('declares the width tokens of §4.4', () => {
    expect({
      label: dn.get('--dn-wdth-label'),
      ui: dn.get('--dn-wdth-ui'),
      head: dn.get('--dn-wdth-head'),
      text: dn.get('--dn-wdth-text'),
      display: dn.get('--dn-wdth-display'),
    }).toEqual({ label: '62%', ui: '75%', head: '88%', text: '100%', display: '125%' });
  });

  it('declares the one curve and the four durations of §6', () => {
    expect(dn.get('--dn-ease')).toBe('cubic-bezier(.19, 1, .22, 1)');
    expect([1, 2, 3, 4].map((n) => dn.get(`--dn-dur-${n}`))).toEqual(['160ms', '500ms', '1000ms', '1300ms']);
  });

  it('declares the §5 layout tokens', () => {
    expect(dn.get('--dn-nav-h')).toBe('0px');
    expect(dn.get('--dn-measure')).toBe('36rem');
    expect(dn.get('--dn-page-max')).toBe('94rem');
    expect(dn.get('--dn-gut')).toBe('16px');
    // 3.5em on :root is 3.5rem; a registered length, so it computes there (WebKit root-rem bug).
    expect(tokensCss).toMatch(/@media \(min-width: 700px\) \{\s*:root \{[^}]*--dn-nav-h:\s*3\.5em/);
    expect(tokensCss.replace(/\s+/g, ' ')).toMatch(/@property --dn-nav-h \{ syntax: '<length>'; inherits: true;/);
    expect(tokensCss).toMatch(/@media \(min-width: 760px\) \{\s*:root \{[^}]*--dn-gut:\s*2\.5rem/);
  });
});

describe('root font size (§4.3)', () => {
  const base = read('src/styles/base.css');
  const m = /html\s*\{[^}]*font-size:\s*clamp\(\s*([\d.]+)rem\s*,\s*([^,]+),\s*([\d.]+)rem\s*\)/.exec(base);

  it('is the §4.3 clamp', () => {
    expect(m).not.toBeNull();
    expect([m![1], m![2]!.trim(), m![3]]).toEqual(['0.9375', '0.125rem + 0.9722vw', '1.375']);
  });

  it('max/min is at most 2.5, so text still reaches 200% under zoom', () => {
    expect(Number(m![3]) / Number(m![1])).toBeLessThanOrEqual(2.5);
  });
});

describe('doc theme tokens (§9.1)', () => {
  const doc = declarations(tokensCss, '--doc-');
  const SPEC: Record<string, { value: string; resolves?: string }> = {
    '--doc-bg': { value: 'var(--dn-bg)', resolves: '#0d0c0b' },
    '--doc-surface': { value: 'var(--dn-bg-raised)', resolves: '#151311' },
    '--doc-text': { value: 'var(--dn-text)', resolves: '#ece4d3' },
    '--doc-text-strong': { value: 'var(--dn-text)', resolves: '#ece4d3' },
    '--doc-muted': { value: 'var(--dn-text-2)', resolves: '#bdb5a6' },
    '--doc-line': { value: 'var(--dn-rule-strong)', resolves: '#4a453e' },
    '--doc-line-soft': { value: 'var(--dn-rule)', resolves: '#2c2925' },
    '--doc-accent': { value: 'var(--dn-text)', resolves: '#ece4d3' },
    '--doc-accent-2': { value: 'var(--dn-text-2)', resolves: '#bdb5a6' },
    '--doc-accent-3': { value: 'var(--dn-text-label)', resolves: '#a39b8c' },
    '--doc-font-display': { value: 'var(--dn-font-site)' },
    '--doc-display-stretch': { value: '112%' },
    '--doc-font-body': { value: '"Atkinson Hyperlegible Next", "Noto Sans", "Chivo Mono", system-ui, sans-serif' },
    '--doc-font-mono': { value: '"Chivo Mono", ui-monospace, Menlo, Consolas, monospace' },
  };

  it('defines exactly the §9.1 tokens with the §9.1 values', () => {
    expect(Object.fromEntries(doc)).toEqual(Object.fromEntries(Object.entries(SPEC).map(([k, v]) => [k, v.value])));
  });

  const resolve = (name: string): string => {
    const ref = /^var\((--dn-[a-z0-9-]+)\)$/.exec(doc.get(name) ?? '');
    if (!ref) throw new Error(`${name} does not point at a --dn token`);
    return hex(ref[1]!);
  };

  it('each colour token resolves to its §9.1 hex, and none to the tested red', () => {
    for (const [name, { resolves }] of Object.entries(SPEC)) {
      if (!resolves) continue;
      expect(resolve(name), name).toBe(resolves);
      expect(resolve(name), name).not.toBe('#e8492d');
    }
  });

  it('meets the §9.2 contrast targets', () => {
    const [bg, surface, text, muted] = ['--doc-bg', '--doc-surface', '--doc-text', '--doc-muted'].map(resolve);
    expect(contrast(text!, bg!)).toBeGreaterThanOrEqual(14.5);
    expect(contrast(text!, surface!)).toBeGreaterThanOrEqual(14.5);
    expect(contrast(muted!, bg!)).toBeGreaterThanOrEqual(9);
    expect(contrast(muted!, surface!)).toBeGreaterThanOrEqual(9);
    expect(contrast(resolve('--doc-accent'), bg!)).toBeGreaterThanOrEqual(14.5);
    expect(round2(contrast(resolve('--doc-accent-3'), resolve('--doc-line-soft')))).toBe(5.25);
  });

  it('keeps text at least 7:1 on every composited highlight, with the §9.2 composites', () => {
    const text = resolve('--doc-text');
    const surface = resolve('--doc-surface');
    const bg = resolve('--doc-bg');
    const cases: [string, string, string][] = [
      ['copilot --accent-soft on paper', blend(resolve('--doc-accent'), 0.12, surface), '#2f2c28'],
      ['slamwich --gold-soft on paper', blend(resolve('--doc-accent-2'), 0.2, surface), '#37332f'],
      ['quartz --highlight on bg', blend(resolve('--doc-accent'), 0.15, bg), '#2e2c29'],
      ['quartz --textHighlight on bg', blend(resolve('--doc-accent-2'), 0.35, bg), '#4b4741'],
      ['selection on bg', blend('#ece4d3', 0.22, bg), '#3e3c37'],
    ];
    for (const [label, ground, expected] of cases) {
      expect(ground, label).toBe(expected);
      expect(contrast(text, ground), label).toBeGreaterThanOrEqual(7);
    }
  });

  it('registers --dn-doc-rem as an inheriting length, 16px initially (§9.3)', () => {
    expect(tokensCss.replace(/\s+/g, ' ')).toMatch(
      /@property --dn-doc-rem \{ syntax: '<length>'; inherits: true; initial-value: 16px; \}/,
    );
  });
});

function cssFiles(dir = join(ROOT, 'src'), out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) cssFiles(p, out);
    else if (e.name.endsWith('.css')) out.push(p);
  }
  return out;
}

describe('every custom property used is defined', () => {
  it('var(--x) in any stylesheet under src/ has a definition or registration somewhere', () => {
    const all = cssFiles()
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    const used = new Set([...all.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)].map((m) => m[1]!));
    const defined = new Set([
      ...[...all.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1]!),
      ...[...all.matchAll(/@property\s+(--[a-z0-9-]+)/gi)].map((m) => m[1]!),
    ]);
    expect([...used].filter((v) => !defined.has(v))).toEqual([]);
  });

  it('rules, strong rules and the inactive-mark grey are never a text colour (§3.1)', () => {
    const offenders: string[] = [];
    for (const f of cssFiles()) {
      const css = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      for (const m of css.matchAll(/(?:^|[\s;{])color\s*:\s*([^;}]+)/g)) {
        if (/var\(--dn-(rule|rule-strong|ui-muted)\)/.test(m[1]!)) offenders.push(`${f}: ${m[0].trim()}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
