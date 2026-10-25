// ABOUTME: Link classifier — categorize links for anchor/SPA/browser navigation.
// ABOUTME: Determines navigation strategy for clicked links in the doc viewer.

/**
 * Classify a link based on its URL and attributes.
 *
 * Returns one of:
 * - 'anchor': fragment link (#id)
 * - 'spa': same-origin SPA route (path outside /artifact-docs/, no extension)
 * - 'browser': different origin, external, download, or modifier key held
 */
export function classifyLink(
  url: URL,
  opts: {
    target?: string | null;
    download?: boolean;
    button: number;
    modifiers: boolean;
  },
  currentDocUrl: URL,
): 'anchor' | 'spa' | 'browser' {
  // Non-primary button (middle, right, etc.)
  if (opts.button !== 0) {
    return 'browser';
  }

  // Modifier key held (Ctrl, Meta, Shift, Alt)
  if (opts.modifiers) {
    return 'browser';
  }

  // Download attribute
  if (opts.download) {
    return 'browser';
  }

  // Explicit target="_blank"
  if (opts.target === '_blank') {
    return 'browser';
  }

  // Different origin (absolute URL with different scheme/host)
  if (url.origin !== currentDocUrl.origin) {
    return 'browser';
  }

  // Anchor link: href is #id (relative to current doc)
  if (url.pathname === currentDocUrl.pathname && url.hash && !url.search) {
    return 'anchor';
  }

  // Same-origin SPA link: path not under /artifact-docs/ and no file extension
  // Must have no target or target is _self, _top, _parent
  if (
    !['_blank', '_new'].includes(opts.target ?? '') &&
    !url.pathname.includes('/artifact-docs/') &&
    !url.pathname.match(/\.\w+$/) // no file extension at end
  ) {
    return 'spa';
  }

  // Everything else is browser (external file, static doc, etc.)
  return 'browser';
}
