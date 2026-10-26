// ABOUTME: Quartz page support — article-only extraction, in-app internal links, collapsible
// ABOUTME: callouts and the print/screen theme state that Quartz's stripped scripts would have set.
import { devWarn } from './devWarn';

/** A Quartz page contains `#quartz-root`. */
export function isQuartzDoc(doc: Document): boolean {
  return doc.getElementById('quartz-root') !== null;
}

const CHROME = '.sidebar, footer, .search, .graph, .explorer, .backlinks, .breadcrumb-container';

/**
 * Reduce a Quartz page to its article: keep `#quartz-root > #quartz-body > .center`, drop every
 * other child of those wrappers, and strip the navigation chrome from `.center`. The wrappers
 * stay because the single-column overrides select `#quartz-body .center`.
 */
export function extractArticle(doc: Document): void {
  const root = doc.getElementById('quartz-root');
  const body = doc.getElementById('quartz-body');
  const center = body?.querySelector<HTMLElement>(':scope > .center') ?? doc.querySelector<HTMLElement>('#quartz-body .center');
  if (!root || !body || !center) {
    devWarn('Quartz article-only: #quartz-body .center not found, page left whole');
    return;
  }
  center.querySelectorAll(CHROME).forEach((n) => n.remove());
  body.replaceChildren(center);
  root.replaceChildren(body);
  doc.body.replaceChildren(root);
  const h1s = doc.body.querySelectorAll('h1').length;
  if (h1s !== 1) devWarn(`Quartz page has ${h1s} h1 elements after mount (expected 1)`);
  if (doc.body.querySelector('code.mermaid, pre.mermaid')) {
    devWarn('Mermaid blocks left as source: no mermaid renderer is bundled (decision 12)');
  }
}

/** The single-column overrides, appended last so they win over Quartz's grid. */
export const QUARTZ_OVERRIDE_CSS = [
  '#quartz-body{display:block!important;padding:0 24px!important}',
  '#quartz-body .center{max-width:760px!important;width:auto!important;margin:0 auto!important;padding:32px 0!important}',
  // Scripts are stripped, so honour reduced motion for every transition and animation.
  '@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}',
];

/** Callout rules, appended after the overrides. Quartz folded with script-set heights. */
export const CALLOUT_CSS = [
  '.callout.is-collapsed > .callout-content { display: none }',
  '.callout-title[role="button"]:focus-visible { outline: 2px solid currentColor; outline-offset: 2px }',
];

/** The doc path for a Quartz slug: Quartz writes `tools/ripgrep.html` but links `./tools/ripgrep`. */
export function quartzDocPath(base: string, slug: string): string {
  return `${base.replace(/\/+$/, '')}/${slug}.html`;
}

/** The fake fixture prefix a Quartz build lives under, or else the folder holding the page. */
export function fixtureBase(path: string): string {
  const m = path.match(/^(.*\/__fixtures__\/quartz\/build-[a-z0-9]+)\//);
  if (m) return m[1]!;
  return path.slice(0, path.lastIndexOf('/'));
}

/**
 * Point every internal link at its in-app route, at load rather than on click, so modifier-clicks
 * and new tabs get a real URL. Links with `data-slug` use it; tag and folder links (no slug) are
 * resolved against the doc and made relative to the site root, which is the doc's own URL minus
 * its `<body data-slug>`. Must run before URLs are absolutised: the hash is read from the raw href.
 */
export function rewriteInternalLinks(
  root: ParentNode,
  docUrl: URL,
  toRoute: (slug: string, hash: string) => string,
): void {
  const pageSlug = rootSlug(root);
  const sitePrefix = pageSlug && docUrl.pathname.endsWith(`/${pageSlug}.html`)
    ? docUrl.pathname.slice(0, docUrl.pathname.length - `/${pageSlug}.html`.length)
    : null;

  for (const a of root.querySelectorAll<HTMLAnchorElement>('a.internal')) {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#')) continue;
    let resolved: URL;
    try {
      resolved = new URL(href, docUrl);
    } catch {
      continue;
    }
    let slug = a.getAttribute('data-slug');
    if (!slug) {
      if (sitePrefix === null || !resolved.pathname.startsWith(sitePrefix + '/')) continue;
      slug = decodeURIComponent(resolved.pathname.slice(sitePrefix.length + 1)).replace(/\.html$/, '');
      if (slug === '' || slug.endsWith('/')) slug += 'index';
    }
    a.setAttribute('href', toRoute(slug, resolved.hash));
  }
}

// The page slug lives on <body data-slug>; callers pass doc.body or a node inside it.
function rootSlug(root: ParentNode): string | null {
  const el = root as Element;
  if (el.getAttribute?.('data-slug')) return el.getAttribute('data-slug');
  return el.ownerDocument?.body?.getAttribute('data-slug') ?? null;
}

function titleOf(callout: Element): Element | undefined {
  return Array.from(callout.children).find((c) => c.classList.contains('callout-title'));
}

/** Give each collapsible callout's title the button semantics Quartz's script would have driven. */
export function prepareCallouts(root: ParentNode): void {
  for (const callout of root.querySelectorAll('.callout.is-collapsible')) {
    const title = titleOf(callout);
    if (!title) continue;
    title.setAttribute('role', 'button');
    title.setAttribute('tabindex', '0');
    title.setAttribute('aria-expanded', callout.classList.contains('is-collapsed') ? 'false' : 'true');
  }
}

/** Toggle a callout and keep `aria-expanded` in step. */
export function toggleCallout(callout: Element): void {
  const collapsed = callout.classList.toggle('is-collapsed');
  titleOf(callout)?.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
}

/**
 * Keep the host's `saved-theme` at dark on screen and light in print (#8 section 3). Listens for
 * `change` on the print media query plus `beforeprint`/`afterprint`; returns a cleanup.
 */
export function bindPrintTheme(host: HTMLElement): () => void {
  const mql = typeof window.matchMedia === 'function' ? window.matchMedia('print') : null;
  const sync = (printing: boolean) => host.setAttribute('saved-theme', printing ? 'light' : 'dark');
  const onChange = (e: { matches: boolean }) => sync(e.matches);
  const onBefore = () => sync(true);
  const onAfter = () => sync(mql?.matches ?? false);
  sync(mql?.matches ?? false);
  mql?.addEventListener('change', onChange);
  window.addEventListener('beforeprint', onBefore);
  window.addEventListener('afterprint', onAfter);
  return () => {
    mql?.removeEventListener('change', onChange);
    window.removeEventListener('beforeprint', onBefore);
    window.removeEventListener('afterprint', onAfter);
  };
}
