// ABOUTME: Lime lint (spec section 16) and type lint (spec sections 7 and 16) over every stylesheet.
// ABOUTME: Lime may appear only as the tested mark; type floors, caps and tracking are enforced per rule.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const STYLES = join(__dirname, '..', 'styles');

interface Rule {
  file: string;
  selector: string;
  body: string;
  art: boolean;
}

function parseRules(file: string, css: string): Rule[] {
  const rules: Rule[] = [];
  // Mark art exemptions with a sentinel so comment stripping keeps them.
  const src = css
    .replace(/\/\*\s*type-lint:\s*art\s*\*\//g, '@@ART@@')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  let start = 0;
  let selectorStart = 0;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') {
      const next = src.indexOf('}', i);
      const nextOpen = src.indexOf('{', i + 1);
      if (next !== -1 && (nextOpen === -1 || next < nextOpen)) {
        const rawSel = src.slice(selectorStart, i);
        rules.push({
          file,
          selector: rawSel.replace(/@@ART@@/g, '').trim(),
          body: src.slice(i + 1, next),
          art: rawSel.includes('@@ART@@'),
        });
        i = next;
        selectorStart = next + 1;
      } else {
        selectorStart = i + 1; // at-rule wrapper such as @media
      }
      start = i;
    } else if (ch === '}' || ch === ';') {
      selectorStart = i + 1;
    }
  }
  void start;
  return rules;
}

function loadRules(): Rule[] {
  return readdirSync(STYLES)
    .filter((f) => f.endsWith('.css'))
    .flatMap((f) => parseRules(f, readFileSync(join(STYLES, f), 'utf-8')));
}

const rules = loadRules();
const tag = (r: Rule) => `${r.file}: ${r.selector}`;

describe('Lime lint (spec section 16)', () => {
  it('parses a meaningful number of rules', () => {
    expect(rules.length).toBeGreaterThan(100);
  });

  it('lime literals occur only in the --dn-tested definition', () => {
    const literal = /c0fe04|192,\s*254,\s*4\b/i;
    const offenders: string[] = [];
    for (const r of rules) {
      for (const decl of r.body.split(';')) {
        if (!literal.test(decl)) continue;
        if (!/^\s*--dn-tested\s*:/.test(decl)) offenders.push(`${tag(r)} -> ${decl.trim()}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('var(--dn-tested) occurs only in .tested-mark rules', () => {
    const offenders = rules
      .filter((r) => r.body.includes('var(--dn-tested)'))
      .filter((r) => !r.selector.split(',').every((s) => /^\.tested-mark\b/.test(s.trim())))
      .map(tag);
    expect(offenders).toEqual([]);
  });

  it('var(--dn-term-*) occurs only in terminal, .t- and .crom rules', () => {
    const offenders = rules
      .filter((r) => /var\(--dn-term-/.test(r.body))
      .filter(
        (r) => !r.selector.split(',').every((s) => /^\.(terminal|t-|crom)/.test(s.trim())),
      )
      .map(tag);
    expect(offenders).toEqual([]);
  });
});

describe('Type lint (spec sections 7 and 16)', () => {
  const decls = (r: Rule) =>
    r.body
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        const idx = d.indexOf(':');
        return [d.slice(0, idx).trim(), d.slice(idx + 1).trim()] as const;
      });

  it('no font-size below 12 px', () => {
    const offenders: string[] = [];
    for (const r of rules) {
      if (r.art) continue;
      for (const [prop, val] of decls(r)) {
        if (prop !== 'font-size') continue;
        const m = /^(\d*\.?\d+)(px|rem|em)$/.exec(val);
        if (!m) continue; // var(), clamp() etc. resolve to tokens checked below
        const n = parseFloat(m[1] ?? '0');
        const px = m[2] === 'px' ? n : n * 16;
        if (px < 12) offenders.push(`${tag(r)} -> ${val}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('no --dn-t-* size token is defined below 12 px', () => {
    const tokens = readFileSync(join(STYLES, 'tokens.css'), 'utf-8');
    const offenders: string[] = [];
    for (const m of tokens.matchAll(/(--dn-t-[a-z0-9-]+)\s*:\s*(\d*\.?\d+)(px|rem)\b/g)) {
      const n = parseFloat(m[2] ?? '0');
      if ((m[3] === 'px' ? n : n * 16) < 12) offenders.push(`${m[1]} ${m[2]}${m[3]}`);
    }
    expect(offenders).toEqual([]);
  });

  it('text-transform: uppercase only in rules declaring the mono font', () => {
    const offenders = rules
      .filter((r) => !r.art)
      .filter((r) => decls(r).some(([p, v]) => p === 'text-transform' && v === 'uppercase'))
      .filter((r) => !decls(r).some(([p, v]) => p === 'font-family' && v === 'var(--dn-font-mono)'))
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
        const n = parseFloat(m[1] ?? '0');
        const em = m[2] === 'em' ? n : m[2] === 'rem' ? n : null;
        if (em !== null && em > 0.08) offenders.push(`${tag(r)} -> ${val}`);
        if (em === null && n > 0) offenders.push(`${tag(r)} -> ${val} (px tracking; use em)`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('letter-spacing tokens do not exceed 0.08em', () => {
    const tokens = readFileSync(join(STYLES, 'tokens.css'), 'utf-8');
    const offenders: string[] = [];
    for (const m of tokens.matchAll(/(--dn-[a-z0-9-]*(?:ls|tracking)[a-z0-9-]*)\s*:\s*(-?\d*\.?\d+)em/g)) {
      if (parseFloat(m[2] ?? '0') > 0.08) offenders.push(`${m[1]} ${m[2]}em`);
    }
    expect(offenders).toEqual([]);
  });
});
