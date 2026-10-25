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

  // Different origin
  if (url.origin !== currentDocUrl.origin) {
    return 'browser';
  }

  const target = opts.target ?? '';
  const targetOk = target === '' || ['_self', '_top', '_parent'].includes(target.toLowerCase());

  // Anchor: `#id`, or the current doc URL plus a hash
  if (
    url.hash &&
    url.pathname === currentDocUrl.pathname &&
    url.search === currentDocUrl.search &&
    targetOk
  ) {
    return 'anchor';
  }

  // SPA: same origin, outside the docs folder, last segment without a file extension
  const lastSegment = url.pathname.split('/').pop() ?? '';
  if (
    targetOk &&
    !url.pathname.startsWith('/artifact-docs/') &&
    !/\.[^./]+$/.test(lastSegment)
  ) {
    return 'spa';
  }

  return 'browser';
}
