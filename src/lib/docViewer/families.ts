// ABOUTME: Doc families — detection by :host variables, font-stack mapping and the theme rule that
// ABOUTME: points each family's own colour variables at the site's --doc-* tokens (#52, #53 §13).

export type DocFamily = 'copilot' | 'slamwich' | 'weekly' | 'quartz';

const DETECT_ORDER: Exclude<DocFamily, 'quartz'>[] = ['slamwich', 'copilot', 'weekly'];

/** Variables a rewritten :host rule must all define for a family to match. Quartz is by #quartz-root. */
export const SIGNATURES: Record<Exclude<DocFamily, 'quartz'>, string[]> = {
  copilot: ['--gold-bar', '--accent-soft', '--ghost'],
  slamwich: ['--meter', '--meter-track', '--accent-ink'],
  weekly: ['--accent2', '--accent3', '--chip'],
};

const ACCENT_SOFT = 'color-mix(in srgb, var(--doc-accent) 12%, transparent)';
const GHOST = 'color-mix(in srgb, var(--doc-text) 5%, transparent)';
const GROUND_SHARED = {
  '--ground': 'var(--doc-bg)',
  '--paper': 'var(--doc-surface)',
  '--ink': 'var(--doc-text)',
  '--muted': 'var(--doc-muted)',
  '--line': 'var(--doc-line)',
  '--line-soft': 'var(--doc-line-soft)',
};

/**
 * Quartz's own derivation of its Obsidian-theme variables from the base palette (its `:root` rule).
 * A build with an Obsidian theme plugin redefines these with literal colours, which would bypass
 * the mapped base variables (the body ground would stay the theme's). Re-asserting the derivation
 * keeps §13.2's premise true: they derive from the mapped variables.
 */
const QUARTZ_DERIVED: Record<string, string> = {
  '--background-primary': 'var(--light)',
  '--background-primary-alt': 'var(--light)',
  '--background-secondary': 'var(--lightgray)',
  '--background-secondary-alt': 'var(--lightgray)',
  '--background-modifier-border': 'var(--lightgray)',
  '--background-modifier-border-hover': 'var(--gray)',
  '--background-modifier-border-focus': 'var(--secondary)',
  '--text-normal': 'var(--darkgray)',
  '--text-muted': 'var(--gray)',
  '--text-faint': 'var(--gray)',
  '--text-accent': 'var(--secondary)',
  '--text-accent-hover': 'var(--tertiary)',
  '--text-on-accent': 'var(--light)',
  '--text-on-accent-inverted': 'var(--dark)',
  '--text-highlight-bg': 'var(--textHighlight)',
  '--interactive-normal': 'var(--light)',
  '--interactive-hover': 'var(--lightgray)',
  '--interactive-accent': 'var(--secondary)',
  '--interactive-accent-hover': 'var(--tertiary)',
  '--color-base-00': 'var(--light)',
  '--color-base-05': 'var(--light)',
  '--color-base-10': 'var(--light)',
  '--color-base-20': 'var(--lightgray)',
  '--color-base-25': 'var(--lightgray)',
  '--color-base-30': 'var(--lightgray)',
  '--color-base-35': 'var(--lightgray)',
  '--color-base-40': 'var(--gray)',
  '--color-base-50': 'var(--gray)',
  '--color-base-60': 'var(--gray)',
  '--color-base-70': 'var(--darkgray)',
  '--color-base-100': 'var(--dark)',
  '--font-text': 'var(--bodyFont)',
  '--font-monospace': 'var(--codeFont)',
  '--font-interface': 'var(--bodyFont)',
  '--nav-item-color': 'var(--darkgray)',
  '--nav-item-color-hover': 'var(--dark)',
  '--nav-item-color-active': 'var(--secondary)',
  '--nav-item-background-hover': 'var(--lightgray)',
  '--nav-item-background-active': 'var(--highlight)',
  '--tag-background': 'var(--highlight)',
  '--tag-color': 'var(--secondary)',
  '--tag-background-hover': 'var(--lightgray)',
  '--icon-color': 'var(--darkgray)',
  '--icon-color-hover': 'var(--dark)',
  '--icon-color-active': 'var(--secondary)',
  '--divider-color': 'var(--lightgray)',
  '--link-color': 'var(--secondary)',
  '--link-color-hover': 'var(--tertiary)',
};

/** Doc variable -> value, per family (visual spec §13.2). */
export const THEME_MAPS: Record<DocFamily, Record<string, string>> = {
  copilot: {
    ...GROUND_SHARED,
    '--accent': 'var(--doc-accent)',
    '--accent-soft': ACCENT_SOFT,
    '--gold': 'var(--doc-accent-2)',
    '--gold-bar': 'var(--doc-accent-2)',
    '--ghost': GHOST,
  },
  slamwich: {
    ...GROUND_SHARED,
    '--ghost': GHOST,
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
    ...QUARTZ_DERIVED,
  },
};

type RuleContainer = { cssRules?: CSSRuleList };

function walk(rules: CSSRuleList, visit: (rule: CSSRule) => void): void {
  for (const rule of Array.from(rules)) {
    visit(rule);
    const nested = (rule as RuleContainer).cssRules;
    if (nested) walk(nested, visit);
  }
}

/** Custom properties declared by any rewritten `:host` rule (also inside @media, @layer…). */
function hostCustomProperties(rules: CSSRuleList): Set<string> {
  const found = new Set<string>();
  walk(rules, (rule) => {
    if (!(rule instanceof CSSStyleRule) || !rule.selectorText.includes(':host')) return;
    const text = rule.cssText;
    const body = text.slice(text.indexOf('{') + 1);
    for (const m of body.matchAll(/(--[\w-]+)\s*:/g)) found.add(m[1]!);
  });
  return found;
}

/**
 * Identify the Doc family of an adapted sheet. A family matches when every variable in its
 * signature is defined on a rewritten `:host` rule. Quartz is identified by `#quartz-root` instead.
 */
export function detectFamily(rules: CSSRuleList, isQuartz: boolean): DocFamily | null {
  if (isQuartz) return 'quartz';
  const vars = hostCustomProperties(rules);
  return DETECT_ORDER.find((f) => SIGNATURES[f].every((v) => vars.has(v))) ?? null;
}

// ---------- fonts ----------

const MONO_FIRST = new Set([
  'ui-monospace',
  'sfmono-regular',
  'sf mono',
  'menlo',
  'consolas',
  'monospace',
  'monaco',
  'courier',
  'courier new',
  'jetbrains mono',
  'ibm plex mono',
  'fira code',
  'source code pro',
  'roboto mono',
]);
const KEYWORDS = /^(inherit|initial|unset|revert|revert-layer)$/i;

function firstFamily(stack: string): string {
  const m = stack.trim().match(/^(?:"([^"]*)"|'([^']*)'|([^,]*))/);
  return (m?.[1] ?? m?.[2] ?? m?.[3] ?? '').trim().toLowerCase();
}

/**
 * The site font role for a `font-family` stack: monospace first -> mono, anything else -> body.
 * Returns null when the stack must stay: CSS-wide keywords, `var()` stacks (already indirect)
 * and KaTeX faces (maths glyph fonts, not text).
 */
export function mapFontStack(stack: string): string | null {
  const s = stack.trim();
  if (!s || KEYWORDS.test(s) || s.includes('var(')) return null;
  const first = firstFamily(s);
  if (first.startsWith('katex')) return null;
  return MONO_FIRST.has(first) ? 'var(--doc-font-mono)' : 'var(--doc-font-body)';
}

/** The family list of a `font` shorthand: everything after the size (and optional /line-height). */
function familyFromShorthand(font: string): string {
  const m = font.match(/(?:^|\s)[\d.]+(?:px|em|rem|pt|%|ex|ch|cqi)(?:\s*\/\s*[^\s]+)?\s+(.+)$/i);
  return m?.[1]?.replace(/\s*!important\s*$/i, '') ?? '';
}

/**
 * Set `font-family` in place on every style rule that has one (also via the `font` shorthand).
 * Never rebuilds a rule. Returns how many rules changed.
 */
export function mapFontFamilies(rules: CSSRuleList): number {
  let changed = 0;
  walk(rules, (rule) => {
    if (!(rule instanceof CSSStyleRule)) return;
    const style = rule.style;
    const own = style.getPropertyValue('font-family').trim();
    const stack = own || familyFromShorthand(style.getPropertyValue('font'));
    const target = stack ? mapFontStack(stack) : null;
    if (!target) return;
    const priority = style.getPropertyPriority('font-family') || (style.getPropertyPriority('font') ? 'important' : '');
    style.setProperty('font-family', target, priority);
    changed++;
  });
  return changed;
}

// ---------- the theme rule ----------

/** True when the doc already styles `::selection` (SLAMWICH does). */
export function hasOwnSelection(rules: CSSRuleList): boolean {
  let found = false;
  walk(rules, (rule) => {
    if (rule instanceof CSSStyleRule && rule.selectorText.includes('::selection')) found = true;
  });
  return found;
}

/**
 * The one rule appended to a mapped doc's sheet: on screen only, the family's variables point at
 * the --doc-* tokens with !important (which wins over the doc's forced-dark :host rules inside a
 * shadow tree), h1 takes the display face, and docs without their own selection colour get the
 * neutral one. Print never matches, so docs keep their light defaults there.
 */
export function themeRule(family: DocFamily, opts: { selection: boolean }): string {
  const decls = Object.entries(THEME_MAPS[family])
    .map(([v, value]) => `${v}: ${value} !important;`)
    .join(' ');
  const selection = opts.selection ? ' ::selection { background: rgba(232, 232, 232, 0.22); }' : '';
  return (
    `@media screen { :host { ${decls} font-synthesis: none; }` +
    ` h1 { font-family: var(--doc-font-display) !important; }${selection} }`
  );
}
