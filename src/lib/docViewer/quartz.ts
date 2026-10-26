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
