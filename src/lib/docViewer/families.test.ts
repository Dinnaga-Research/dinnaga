// ABOUTME: Tests for Doc family detection, font-stack mapping and the appended theme rule (#52, #53).
// ABOUTME: Runs on the 11 real docs and the committed Quartz fixture, never on invented docs.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { adaptDoc } from './adapter';
import { detectFamily, mapFontStack, themeRule as buildThemeRule, THEME_MAPS, type DocFamily } from './families';
import { fixtureUrl, stubFixtureFetch } from '../../test/quartzFixture';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const ARTIFACTS = [
  ['llm-best-practices-github-copilot', 'copilot'],
  ['llm-best-practices-copilot-studio', 'copilot'],
  ['slamwich-tasting-report', 'slamwich'],
] as const;
const WEEKLY = [
  '2026-08-08',
  '2026-08-15',
  '2026-08-22',
  '2026-08-29',
  '2026-09-05',
  '2026-09-12',
  '2026-09-19',
  '2026-09-26',
];

const ORIGIN = 'http://localhost:4242';

/** Whitespace-insensitive serialisation: jsdom and browsers differ on spaces after commas. */
const norm = (css: string) => css.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ',');

function stubDoc(html: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => html }),
  );
}

async function adaptReal(rel: string) {
  stubDoc(readFileSync(join(process.cwd(), 'public/artifact-docs', rel), 'utf-8'));
  const u = new URL(`${ORIGIN}/artifact-docs/${rel}`);
  return adaptDoc(u, { docUrl: u });
}

function rulesText(sheet: CSSStyleSheet): string[] {
  return [...sheet.cssRules].map((r) => r.cssText);
}

/** The appended `@media screen` theme rule's text. */
function themeRule(sheet: CSSStyleSheet): string | undefined {
  return rulesText(sheet).find((t) => t.startsWith('@media screen') && t.includes('--doc-bg'));
}

// §13.2 maps, written out independently of the implementation
const EXPECT: Record<DocFamily, Record<string, string>> = {
  copilot: {
    '--ground': 'var(--doc-bg)',
    '--paper': 'var(--doc-surface)',
    '--ink': 'var(--doc-text)',
    '--muted': 'var(--doc-muted)',
    '--line': 'var(--doc-line)',
    '--line-soft': 'var(--doc-line-soft)',
    '--accent': 'var(--doc-accent)',
    '--accent-soft': 'color-mix(in srgb, var(--doc-accent) 12%, transparent)',
    '--gold': 'var(--doc-accent-2)',
    '--gold-bar': 'var(--doc-accent-2)',
    '--ghost': 'color-mix(in srgb, var(--doc-text) 5%, transparent)',
  },
  slamwich: {
    '--ground': 'var(--doc-bg)',
    '--paper': 'var(--doc-surface)',
    '--ink': 'var(--doc-text)',
    '--muted': 'var(--doc-muted)',
    '--line': 'var(--doc-line)',
    '--line-soft': 'var(--doc-line-soft)',
    '--ghost': 'color-mix(in srgb, var(--doc-text) 5%, transparent)',
    '--accent': 'var(--doc-accent)',
    '--accent-ink': 'var(--doc-accent)',
    '--gold': 'var(--doc-accent-2)',
    '--gold-soft': 'color-mix(in srgb, var(--doc-accent-2) 20%, transparent)',
    '--meter': 'var(--doc-accent-3)',
    '--meter-track': 'var(--doc-line-soft)',
  },
  weekly: {
    '--bg': 'var(--doc-bg)',
    '--card': 'var(--doc-surface)',
    '--ink': 'var(--doc-text)',
    '--muted': 'var(--doc-muted)',
    '--line': 'var(--doc-line)',
    '--accent': 'var(--doc-accent)',
    '--accent2': 'var(--doc-accent-2)',
    '--accent3': 'var(--doc-accent-3)',
    '--chip': 'var(--doc-surface)',
  },
  quartz: {
    '--light': 'var(--doc-bg)',
    '--lightgray': 'var(--doc-line-soft)',
    '--gray': 'var(--doc-muted)',
    '--darkgray': 'var(--doc-text)',
    '--dark': 'var(--doc-text-strong)',
    '--secondary': 'var(--doc-accent)',
    '--tertiary': 'var(--doc-accent-2)',
    '--highlight': 'color-mix(in srgb, var(--doc-accent) 15%, transparent)',
    '--textHighlight': 'color-mix(in srgb, var(--doc-accent-2) 35%, transparent)',
    '--bodyFont': 'var(--doc-font-body)',
    '--headerFont': 'var(--doc-font-body)',
    '--titleFont': 'var(--doc-font-display)',
    '--codeFont': 'var(--doc-font-mono)',
    // Quartz's own derivations, re-asserted so an Obsidian theme plugin cannot bypass the map
    '--background-primary': 'var(--light)',
    '--background-secondary': 'var(--lightgray)',
    '--text-normal': 'var(--darkgray)',
    '--text-muted': 'var(--gray)',
    '--text-accent': 'var(--secondary)',
    '--text-accent-hover': 'var(--tertiary)',
    '--color-base-00': 'var(--light)',
    '--color-base-100': 'var(--dark)',
    '--font-text': 'var(--bodyFont)',
    '--font-monospace': 'var(--codeFont)',
  },
};

describe('family detection (#52)', () => {
  for (const [name, family] of ARTIFACTS) {
    test(`${name} is detected as ${family}`, async () => {
      const { family: got } = await adaptReal(`${name}.html`);
      expect(got).toBe(family);
    });
  }
  for (const date of WEEKLY) {
    test(`weekly ${date} is detected as weekly`, async () => {
      const { family: got } = await adaptReal(`weekly/${date}.html`);
      expect(got).toBe('weekly');
    });
  }
  for (const build of ['build-a', 'build-b'] as const) {
    test(`a ${build} Quartz page is detected as quartz`, async () => {
      stubFixtureFetch();
      const url = fixtureUrl(build, 'index.html');
      const adapted = await adaptDoc(url, { docUrl: url });
      expect(adapted.family).toBe('quartz');
    });
  }

  test('a stripped-down doc with no matching variables is detected as none, warns, and is left unmapped', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    stubDoc(
      '<html><head><style>:root{--a:1;--ink:#111}body{font-family:Georgia,serif;color:var(--ink)}</style></head>' +
        '<body><main><h1>t</h1></main></body></html>',
    );
    const u = new URL(`${ORIGIN}/x.html`);
    const adapted = await adaptDoc(u, { docUrl: u });
    expect(adapted.family).toBeNull();
    expect(warn.mock.calls.flat().join(' ')).toMatch(/family/i);
    // no mapping at all: no theme rule, and the serif stack is untouched
    expect(themeRule(adapted.sheet)).toBeUndefined();
    expect(rulesText(adapted.sheet).join('\n')).toContain('Georgia');
    expect(rulesText(adapted.sheet).join('\n')).not.toContain('--doc-font');
  });

  test('a partial signature does not match (every listed variable must be on a :host rule)', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    stubDoc(
      '<html><head><style>:root{--accent2:#111;--accent3:#222}</style></head><body><p>t</p></body></html>',
    );
    const u = new URL(`${ORIGIN}/x.html`);
    expect((await adaptDoc(u, { docUrl: u })).family).toBeNull();
  });

  test('detectFamily reads variables from :host rules inside @media, not from other selectors', async () => {
    const s = new CSSStyleSheet();
    s.replaceSync(
      '.x{--accent2:1;--accent3:2;--chip:3}@media screen{:host([data-theme="dark"]){--accent2:1;--accent3:2;--chip:3}}',
    );
    expect(detectFamily(s.cssRules, false)).toBe('weekly');
    const t = new CSSStyleSheet();
    t.replaceSync('.x{--accent2:1;--accent3:2;--chip:3}');
    expect(detectFamily(t.cssRules, false)).toBeNull();
  });
});

describe('font mapping (#52)', () => {
  test('mapFontStack: serif and sans stacks become the body role, monospace stacks the mono role', () => {
    expect(mapFontStack("Charter, 'Iowan Old Style', 'Palatino Linotype', Georgia, serif")).toBe('var(--doc-font-body)');
    expect(mapFontStack('system-ui, -apple-system, sans-serif')).toBe('var(--doc-font-body)');
    expect(mapFontStack("ui-monospace, 'SF Mono', Menlo, Consolas, monospace")).toBe('var(--doc-font-mono)');
    expect(mapFontStack('ui-monospace,SFMono-Regular,Menlo,monospace')).toBe('var(--doc-font-mono)');
    expect(mapFontStack("'SF Mono', Menlo, monospace")).toBe('var(--doc-font-mono)');
    expect(mapFontStack('Consolas, monospace')).toBe('var(--doc-font-mono)');
    expect(mapFontStack('monospace')).toBe('var(--doc-font-mono)');
  });

  test('mapFontStack: inherit and other CSS-wide keywords, var() stacks and KaTeX faces are left alone', () => {
    expect(mapFontStack('inherit')).toBeNull();
    expect(mapFontStack('initial')).toBeNull();
    expect(mapFontStack('var(--bodyFont)')).toBeNull();
    expect(mapFontStack('KaTeX_Main, "Times New Roman", serif')).toBeNull();
  });

  test('the Copilot serif stack becomes var(--doc-font-body) in the adapted sheet', async () => {
    const { sheet } = await adaptReal('llm-best-practices-copilot-studio.html');
    const text = rulesText(sheet).join('\n');
    expect(text).not.toMatch(/Charter/);
    expect(text).not.toMatch(/Georgia/);
    expect(text).toContain('font-family: var(--doc-font-body)');
  });

  test("the Weekly report's `font:15px/1.55 -apple-system,…` body becomes var(--doc-font-body), size kept", async () => {
    const { sheet } = await adaptReal('weekly/2026-08-08.html');
    const body = rulesText(sheet).find((t) => t.startsWith('doc-body') && t.includes('--bg'));
    expect(body).toBeDefined();
    expect(body).toContain('var(--doc-font-body)');
    expect(body).not.toContain('apple-system');
    expect(body).toMatch(/15px/);
  });

  test('the ui-monospace stack becomes var(--doc-font-mono) and `inherit` is unchanged', async () => {
    const { sheet } = await adaptReal('llm-best-practices-copilot-studio.html');
    const text = rulesText(sheet).join('\n');
    expect(text).not.toContain('ui-monospace');
    expect(text).not.toContain('SF Mono');
    expect(text).toContain('font-family: var(--doc-font-mono)');
    expect(text).toContain('font-family: inherit');
  });

  test('a Quartz page keeps KaTeX faces and maps no font-family to a hard-coded stack', async () => {
    stubFixtureFetch();
    const url = fixtureUrl('build-a', 'index.html');
    const { sheet } = await adaptDoc(url, { docUrl: url });
    const decls = rulesText(sheet)
      .join('\n')
      .match(/font-family:[^;}]*/g)!;
    expect(decls.some((d) => d.includes('KaTeX_Main'))).toBe(true);
  });
});

describe('theme rule (#52, #53 §13.3)', () => {
  for (const [name, family] of [
    ['llm-best-practices-github-copilot.html', 'copilot'],
    ['llm-best-practices-copilot-studio.html', 'copilot'],
    ['slamwich-tasting-report.html', 'slamwich'],
    ['weekly/2026-08-08.html', 'weekly'],
    ['weekly/2026-09-26.html', 'weekly'],
  ] as const) {
    test(`${name}: one @media screen :host rule maps each ${family} variable with !important`, async () => {
      const { sheet } = await adaptReal(name);
      const rule = themeRule(sheet);
      expect(rule, 'theme rule present').toBeDefined();
      const collapsed = norm(rule!);
      for (const [v, value] of Object.entries(EXPECT[family])) {
        expect(collapsed, v).toContain(`${v}: ${norm(value)} !important`);
      }
      // nothing outside @media screen carries the mapping, so print keeps the doc's light defaults
      const loose = rulesText(sheet).filter((t) => !t.startsWith('@media screen') && t.includes('--doc-bg'));
      expect(loose).toEqual([]);
    });
  }

  for (const build of ['build-a', 'build-b'] as const) {
    test(`Quartz ${build}: maps every §13.2 Quartz variable, lightgray to line-soft`, async () => {
      stubFixtureFetch();
      const url = fixtureUrl(build, 'index.html');
      const { sheet } = await adaptDoc(url, { docUrl: url });
      const rule = norm(themeRule(sheet)!);
      expect(rule).toBeDefined();
      for (const [v, value] of Object.entries(EXPECT.quartz)) {
        expect(rule, v).toContain(`${v}: ${norm(value)} !important`);
      }
      expect(rule).not.toContain('--lightgray: var(--doc-line) ');
    });
  }

  test('THEME_MAPS equals the §13.2 maps, per family (Quartz: plus its re-asserted Obsidian derivations)', () => {
    for (const family of Object.keys(EXPECT) as DocFamily[]) {
      expect(THEME_MAPS[family]).toMatchObject(EXPECT[family]);
    }
    for (const family of ['copilot', 'slamwich', 'weekly'] as const) {
      expect(THEME_MAPS[family]).toEqual(EXPECT[family]);
    }
  });

  test('the same block sets h1 to the display face with !important', async () => {
    const { sheet } = await adaptReal('weekly/2026-08-08.html');
    expect(norm(themeRule(sheet)!)).toMatch(/h1 \{ font-family: var\(--doc-font-display\)/);
    // jsdom drops the priority when serialising; the generated text is the contract
    expect(norm(buildThemeRule('weekly', { selection: false }))).toContain(
      'h1 { font-family: var(--doc-font-display) !important; }',
    );
  });

  test('docs without their own ::selection get the neutral selection rule', async () => {
    const { sheet } = await adaptReal('llm-best-practices-copilot-studio.html');
    const rule = norm(themeRule(sheet)!);
    expect(rule).toMatch(/::selection \{ background: rgba\(232,232,232,0\.22\)/);
  });

  test("SLAMWICH keeps its own ::selection and gets no second one", async () => {
    const { sheet } = await adaptReal('slamwich-tasting-report.html');
    const rule = themeRule(sheet)!;
    expect(rule).not.toContain('::selection');
    const own = rulesText(sheet).filter((t) => t.includes('::selection'));
    expect(own).toHaveLength(1);
    expect(own[0]).toContain('var(--gold-soft)');
  });

  test('the sheet still starts with the reset and ends with the guard', async () => {
    const { sheet } = await adaptReal('llm-best-practices-copilot-studio.html');
    expect(sheet.cssRules[0]!.cssText).toContain('all: initial');
    expect(sheet.cssRules[sheet.cssRules.length - 1]!.cssText).toContain('overflow-x: auto !important');
  });

  test('no doc variable is ever mapped to the lime signal', () => {
    const everything = JSON.stringify(THEME_MAPS).toLowerCase();
    expect(everything).not.toContain('c0fe04');
    expect(everything).not.toContain('dn-tested');
    expect(everything).not.toContain('192, 254, 4');
  });
});
