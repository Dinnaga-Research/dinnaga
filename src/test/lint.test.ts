// ABOUTME: Red lint and type lint (spec 2026-11-12-darkroom.md §10) over every stylesheet and
// ABOUTME: every .ts/.tsx under src/: red only as the tested mark and stamp; type floors, caps and tracking.
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..');

function walk(dir: string, test: (name: string) => boolean, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, test, out);
    else if (test(e.name)) out.push(p);
  }
  return out;
}

const CSS_FILES = walk(SRC, (n) => n.endsWith('.css'));
// Test files assert on the literals below, so they are not scanned as sources.
const CODE_FILES = walk(SRC, (n) => /\.(ts|tsx)$/.test(n) && !/\.test\.tsx?$/.test(n));

interface Rule {
  file: string;
  selector: string;
  body: string;
  art: boolean;
}

/** Flat list of style rules (selector + body), walking into at-rule blocks such as @media. */
function parseRules(file: string, css: string): Rule[] {
  const rules: Rule[] = [];
  const src = css.replace(/\/\*\s*type-lint:\s*art\s*\*\//g, '@@ART@@').replace(/\/\*[\s\S]*?\*\//g, '');
  let selectorStart = 0;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') {
      const close = src.indexOf('}', i);
      const nextOpen = src.indexOf('{', i + 1);
      if (close !== -1 && (nextOpen === -1 || close < nextOpen)) {
        const raw = src.slice(selectorStart, i);
        rules.push({
          file,
          selector: raw.replace(/@@ART@@/g, '').trim(),
          body: src.slice(i + 1, close),
          art: raw.includes('@@ART@@'),
        });
        i = close;
        selectorStart = close + 1;
      } else {
        selectorStart = i + 1; // an at-rule wrapper
      }
    } else if (ch === '}' || ch === ';') {
      selectorStart = i + 1;
    }
  }
  return rules;
}

const rules = CSS_FILES.flatMap((f) => parseRules(relative(SRC, f), readFileSync(f, 'utf8')));
const tag = (r: Rule) => `${r.file}: ${r.selector}`;
const decls = (r: Rule) =>
  r.body
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const idx = d.indexOf(':');
      return [d.slice(0, idx).trim(), d.slice(idx + 1).trim()] as const;
    });

const RED = /e8492d|232,\s*73,\s*45\b/i;
const LIME = /c0fe04|192,\s*254,\s*4\b/i;

describe('Red lint (§10)', () => {
  it('parses a meaningful number of rules', () => {
    expect(rules.length).toBeGreaterThan(40);
  });

  it('the red literal occurs only in the --dn-tested definition', () => {
    const offenders: string[] = [];
    for (const r of rules) {
      for (const d of r.body.split(';')) {
        if (RED.test(d) && !/^\s*--dn-tested\s*:/.test(d)) offenders.push(`${tag(r)} -> ${d.trim()}`);
      }
    }
    for (const f of CODE_FILES) {
      if (RED.test(readFileSync(f, 'utf8'))) offenders.push(relative(SRC, f));
    }
    expect(offenders).toEqual([]);
  });

  it('var(--dn-tested) occurs only in rules whose selectors all start with .tested-mark or .stamp', () => {
    const offenders = rules
      .filter((r) => r.body.includes('var(--dn-tested)'))
      .filter((r) => !r.selector.split(',').every((s) => /^\.(tested-mark|stamp)\b/.test(s.trim())))
      .map(tag);
    expect(offenders).toEqual([]);
  });

  it('no lime literal anywhere', () => {
    const offenders = [...CSS_FILES, ...CODE_FILES].filter((f) => LIME.test(readFileSync(f, 'utf8')));
    expect(offenders.map((f) => relative(SRC, f))).toEqual([]);
  });

  it('nothing under src/lib/darkroom/ names a red', () => {
    const darkroom = CODE_FILES.filter((f) => relative(SRC, f).startsWith('lib/darkroom/'));
    const offenders = darkroom.filter((f) => /e8492d|232,\s*73,\s*45|--dn-tested|\bred\b|safelight/i.test(readFileSync(f, 'utf8')));
    expect(offenders.map((f) => relative(SRC, f))).toEqual([]);
  });
});

describe('Type lint (§4.5, §10)', () => {
  const ROOT_PX = 15; // the smallest root (§4.3), where rem sizes are smallest
  const toPx = (n: number, unit: string) => (unit === 'px' ? n : n * ROOT_PX);

  it('no font-size below 12 px at a 15 px root', () => {
    const offenders: string[] = [];
    for (const r of rules) {
      if (r.art) continue;
      for (const [prop, val] of decls(r)) {
        if (prop !== 'font-size') continue;
        const m = /^(\d*\.?\d+)(px|rem|em)$/.exec(val);
        if (!m) continue; // var(), clamp() and keywords resolve to tokens checked below
        if (toPx(parseFloat(m[1]!), m[2]!) < 12) offenders.push(`${tag(r)} -> ${val}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('no --dn-t-* size token is below 12 px at a 15 px root', () => {
    const offenders: string[] = [];
    for (const f of CSS_FILES) {
      for (const m of readFileSync(f, 'utf8').matchAll(/(--dn-t-[a-z0-9-]+)\s*:\s*(\d*\.?\d+)(px|rem)\b/g)) {
        if (toPx(parseFloat(m[2]!), m[3]!) < 12) offenders.push(`${m[1]} ${m[2]}${m[3]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('text-transform: uppercase only in rules setting font-stretch to the label or ui width', () => {
    const offenders = rules
      .filter((r) => !r.art)
      .filter((r) => decls(r).some(([p, v]) => p === 'text-transform' && v === 'uppercase'))
      .filter(
        (r) =>
          !decls(r).some(
            ([p, v]) => p === 'font-stretch' && (v === 'var(--dn-wdth-label)' || v === 'var(--dn-wdth-ui)'),
          ),
      )
      .map(tag);
    expect(offenders).toEqual([]);
  });

  it('no letter-spacing above 0.08em', () => {
    const offenders: string[] = [];
    for (const r of rules) {
      if (r.art) continue;
      for (const [prop, val] of decls(r)) {
        if (prop !== 'letter-spacing') continue;
        const m = /^(-?\d*\.?\d+)(em|px|rem)$/.exec(val);
        if (!m) continue;
        const n = parseFloat(m[1]!);
        if (m[2] === 'em' && n > 0.08) offenders.push(`${tag(r)} -> ${val}`);
        if (m[2] !== 'em' && n > 0) offenders.push(`${tag(r)} -> ${val} (use em)`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('no tracking token above 0.08em', () => {
    const offenders: string[] = [];
    for (const f of CSS_FILES) {
      const css = readFileSync(f, 'utf8');
      for (const m of css.matchAll(/(--dn-[a-z0-9-]*(?:ls|tracking)[a-z0-9-]*)\s*:\s*(-?\d*\.?\d+)em/g)) {
        if (parseFloat(m[2]!) > 0.08) offenders.push(`${m[1]} ${m[2]}em`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the scan covers stylesheets outside src/styles', () => {
    expect(CSS_FILES.map((f) => relative(SRC, f))).toEqual(
      expect.arrayContaining(['styles/tokens.css', 'styles/base.css', 'styles/layout.css', 'components/DocFrame.css']),
    );
  });
});
