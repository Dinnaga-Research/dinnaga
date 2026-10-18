// ABOUTME: PROTOTYPE (throwaway, branch prototype/doc-viewer) — mounts a standalone HTML doc in an
// ABOUTME: open shadow root, adapting its CSS in place per docs/research/shadow-dom-docs.md.

export type Scheme = 'dark' | 'os';
export type Scope = 'page' | 'article';

export interface MountOptions {
  scheme: Scheme;
  scope: Scope;
  onInternalLink: (slug: string) => void;
}

export interface MountStats {
  ms: number;
  generator: string;
  cssBytes: number;
  sheetsFetched: number;
  sheetsFailed: string[];
  rules: number;
  selectorsRewritten: number;
  mediaSchemeRewritten: number;
  mediaToContainer: number;
  vwToCqi: number;
  fontFacesHoisted: number;
  importsDropped: number;
  fixedRules: number;
  viewportHeightRules: number;
  scriptsStripped: number;
  handlersStripped: number;
  urlsAbsolutised: number;
  docMains: number;
  docH1s: number;
  mermaidBlocks: number;
  callouts: number;
  overflowPx: number;
  warnings: string[];
}

export interface Heading {
  id: string;
  text: string;
  level: number;
}

export interface MountResult {
  stats: MountStats;
  headings: Heading[];
  root: ShadowRoot;
}

const RESET =
  ':host{all:initial;display:block;container:doc / inline-size;overflow-x:auto;position:relative}' +
  'doc-body{display:block}';

// Compound suffix that can follow a root selector: [attr], .class, #id, :not(...).
const COMPOUND = String.raw`((?:\[[^\]]*\]|\.[\w-]+|#[\w-]+|:not\([^)]*\))*)`;
const BOUNDARY = String.raw`(^|[\s>+~,(])`;
const ROOT_RE = new RegExp(BOUNDARY + String.raw`(?::root|html)` + COMPOUND + String.raw`(?![\w-])`, 'g');
const BODY_RE = new RegExp(BOUNDARY + 'body' + COMPOUND + String.raw`(?![\w-])`, 'g');

export function rewriteSelector(sel: string): string {
  return sel
    .replace(ROOT_RE, (_m, pre: string, compound: string) => `${pre}:host${compound ? `(${compound})` : ''}`)
    .replace(BODY_RE, (_m, pre: string, compound: string) => `${pre}doc-body${compound}`)
    .replace(/:target\b/g, '[data-doc-target]');
}

function absolutiseCssUrls(css: string, base: string): string {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q: string, u: string) => {
    if (/^(data:|#|[a-z][\w+.-]*:)/i.test(u)) return m;
    try {
      return `url(${q}${new URL(u, base).href}${q})`;
    } catch {
      return m;
    }
  });
}

const hoisted = new Set<string>();
const fontSheet = new CSSStyleSheet();
let fontSheetAdopted = false;

function hoistFontFace(cssText: string) {
  if (hoisted.has(cssText)) return;
  hoisted.add(cssText);
  fontSheet.insertRule(cssText, fontSheet.cssRules.length);
  if (!fontSheetAdopted) {
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, fontSheet];
    fontSheetAdopted = true;
  }
}

function adaptRules(list: CSSRuleList, owner: CSSStyleSheet | CSSGroupingRule, s: MountStats, scheme: Scheme) {
  for (let i = 0; i < list.length; i++) {
    const rule = list[i];
    s.rules++;
    if (rule instanceof CSSFontFaceRule) {
      hoistFontFace(rule.cssText);
      owner.deleteRule(i--);
      s.fontFacesHoisted++;
      continue;
    }
    if (rule instanceof CSSImportRule) {
      owner.deleteRule(i--);
      s.importsDropped++;
      continue;
    }
    if (rule instanceof CSSStyleRule) {
      const next = rewriteSelector(rule.selectorText);
      if (next !== rule.selectorText) {
        rule.selectorText = next;
        s.selectorsRewritten++;
      }
      const st = rule.style;
      for (let p = 0; p < st.length; p++) {
        const prop = st[p]!;
        const v = st.getPropertyValue(prop);
        if (/\dvw\b/.test(v)) {
          st.setProperty(prop, v.replace(/(\d)vw\b/g, '$1cqi'), st.getPropertyPriority(prop));
          s.vwToCqi++;
        }
        if (prop === 'position' && v.trim() === 'fixed') s.fixedRules++;
        if (/\d(d|s|l)?vh\b/.test(v)) s.viewportHeightRules++;
      }
      if (rule.cssRules?.length) adaptRules(rule.cssRules, rule as unknown as CSSGroupingRule, s, scheme);
      continue;
    }
    if (rule instanceof CSSMediaRule) {
      let mt = rule.media.mediaText;
      if (/prefers-color-scheme/.test(mt) && scheme === 'dark') {
        mt = mt
          .replace(/\(\s*prefers-color-scheme\s*:\s*dark\s*\)/g, 'screen')
          .replace(/\(\s*prefers-color-scheme\s*:\s*light\s*\)/g, 'not all');
        rule.media.mediaText = mt;
        s.mediaSchemeRewritten++;
      }
      adaptRules(rule.cssRules, rule, s, scheme);
      // A pure width query measures the viewport; re-express it against the host container.
      if (/^\(\s*(min|max)-width\s*:[^)]*\)(\s*and\s*\(\s*(min|max)-width\s*:[^)]*\))*$/.test(mt.trim())) {
        const inner = [...rule.cssRules].map((r) => r.cssText).join('\n');
        if (/var\(/.test(inner)) s.warnings.push(`@media ${mt} re-serialised with var(): check it`);
        owner.deleteRule(i);
        owner.insertRule(`@container doc ${mt} {\n${inner}\n}`, i);
        s.mediaToContainer++;
      }
      continue;
    }
    if (rule instanceof CSSGroupingRule) adaptRules(rule.cssRules, rule, s, scheme);
  }
}

function detectGenerator(doc: Document): string {
  if (doc.getElementById('quartz-root')) return 'Quartz';
  if (doc.querySelector('meta[name="generator"]')) return doc.querySelector('meta[name="generator"]')!.getAttribute('content') ?? 'unknown';
  return 'hand-built HTML';
}

export async function mountDoc(host: HTMLElement, docPath: string, opts: MountOptions, signal: AbortSignal): Promise<MountResult> {
  const t0 = performance.now();
  const s: MountStats = {
    ms: 0, generator: '', cssBytes: 0, sheetsFetched: 0, sheetsFailed: [], rules: 0, selectorsRewritten: 0,
    mediaSchemeRewritten: 0, mediaToContainer: 0, vwToCqi: 0, fontFacesHoisted: 0, importsDropped: 0, fixedRules: 0,
    viewportHeightRules: 0, scriptsStripped: 0, handlersStripped: 0, urlsAbsolutised: 0, docMains: 0, docH1s: 0,
    mermaidBlocks: 0, callouts: 0, overflowPx: 0, warnings: [],
  };
  const docUrl = new URL(docPath, location.href);
  const res = await fetch(docUrl, { signal });
  const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
  if (!res.ok || doc.getElementById('root')) throw new Error(`Not a doc (status ${res.status}, or the SPA shell came back)`);
  s.generator = detectGenerator(doc);
  const baseEl = doc.querySelector('base[href]');
  const base = baseEl ? new URL(baseEl.getAttribute('href')!, docUrl).href : docUrl.href;

  // Gather CSS in document order: <style> blocks and fetched <link rel=stylesheet>.
  const parts: string[] = [];
  for (const node of doc.querySelectorAll('style, link[rel~="stylesheet"]')) {
    if (node instanceof HTMLStyleElement) {
      parts.push(absolutiseCssUrls(node.textContent ?? '', base));
    } else {
      const href = new URL(node.getAttribute('href')!, base).href;
      try {
        const r = await fetch(href, { signal });
        if (!r.ok) throw new Error(String(r.status));
        parts.push(absolutiseCssUrls(await r.text(), href));
        s.sheetsFetched++;
      } catch (e) {
        s.sheetsFailed.push(`${href} (${(e as Error).message})`);
      }
    }
  }
  const cssText = parts.join('\n');
  s.cssBytes = cssText.length;
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(RESET + '\n' + cssText);
  adaptRules(sheet.cssRules, sheet, s, opts.scheme);

  // Strip what can't run or shouldn't: scripts, handlers, javascript: URLs, head-only nodes.
  s.scriptsStripped = doc.querySelectorAll('script').length;
  doc.querySelectorAll('script, noscript, link, meta, title, base, style').forEach((n) => n.remove());
  for (const el of doc.body.querySelectorAll('*')) {
    for (const a of [...el.attributes]) {
      if (/^on/i.test(a.name)) {
        el.removeAttribute(a.name);
        s.handlersStripped++;
      } else if (['href', 'src', 'srcset', 'poster', 'data', 'action'].includes(a.name)) {
        const v = a.value.trim();
        if (/^javascript:/i.test(v)) {
          el.removeAttribute(a.name);
          s.handlersStripped++;
        } else if (v && !v.startsWith('#') && a.name !== 'srcset') {
          try {
            const abs = new URL(v, base).href;
            if (abs !== v) {
              el.setAttribute(a.name, abs);
              s.urlsAbsolutised++;
            }
          } catch {
            /* leave it */
          }
        }
      }
    }
  }

  if (opts.scope === 'article' && s.generator === 'Quartz') {
    doc.querySelectorAll('#quartz-root .sidebar, #quartz-root footer, .page-header .search').forEach((n) => n.remove());
    // Quartz lays the page out as a 3-column grid; with the sidebars gone, give the centre the full width.
    sheet.insertRule('#quartz-body{display:block!important;padding:0 24px!important}', sheet.cssRules.length);
    sheet.insertRule('#quartz-body .center{max-width:760px!important;width:auto!important;margin:0 auto!important;padding:32px 0!important}', sheet.cssRules.length);
    s.warnings.push('article-only: sidebars removed and the 3-column grid overridden to one column');
  }

  s.docMains = doc.body.querySelectorAll('main').length;
  s.docH1s = doc.body.querySelectorAll('h1').length;
  s.mermaidBlocks = doc.body.querySelectorAll('code.mermaid, pre.mermaid').length;
  s.callouts = doc.body.querySelectorAll('.callout').length;
  if (s.mermaidBlocks) s.warnings.push(`${s.mermaidBlocks} mermaid block(s) left as source: the prototype doesn't render them`);

  const root = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
  root.adoptedStyleSheets = [sheet];
  const body = document.createElement('doc-body');
  for (const a of doc.body.attributes) body.setAttribute(a.name, a.value);
  body.setAttribute('lang', doc.documentElement.lang || 'en');
  // Theme state the stripped scripts would have set (Quartz attribute; plugin exports use a body class).
  const dark = opts.scheme === 'dark' || matchMedia('(prefers-color-scheme: dark)').matches;
  host.setAttribute('saved-theme', dark ? 'dark' : 'light');
  body.classList.add(dark ? 'theme-dark' : 'theme-light');
  body.append(...document.importNode(doc.body, true).childNodes);
  root.replaceChildren(body);

  root.addEventListener('click', (ev) => {
    const path = ev.composedPath();
    const callout = path.find((n) => n instanceof HTMLElement && n.classList.contains('callout-title')) as HTMLElement | undefined;
    if (callout) {
      callout.parentElement?.classList.toggle('is-collapsed');
      return;
    }
    const a = path.find((n) => n instanceof HTMLAnchorElement) as HTMLAnchorElement | undefined;
    if (!a) return;
    const href = a.getAttribute('href') ?? '';
    const url = new URL(href, base);
    if (url.origin === location.origin && url.pathname === docUrl.pathname && url.hash) {
      ev.preventDefault();
      const id = decodeURIComponent(url.hash.slice(1));
      const target = root.getElementById(id);
      root.querySelectorAll('[data-doc-target]').forEach((n) => n.removeAttribute('data-doc-target'));
      target?.setAttribute('data-doc-target', '');
      target?.scrollIntoView();
      history.replaceState(history.state, '', `#${id}`);
      return;
    }
    const slug = a.dataset.slug;
    if (a.classList.contains('internal') && slug) {
      ev.preventDefault();
      opts.onInternalLink(slug);
    }
  });

  const headings: Heading[] = [...root.querySelectorAll('h2[id], h3[id]')].map((h) => ({
    id: h.id,
    text: (h.textContent ?? '').trim(),
    level: Number(h.tagName[1]),
  }));
  if (location.hash) root.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();

  await new Promise((r) => requestAnimationFrame(r));
  s.overflowPx = Math.max(0, host.scrollWidth - host.clientWidth);
  s.ms = Math.round(performance.now() - t0);
  return { stats: s, headings, root };
}
