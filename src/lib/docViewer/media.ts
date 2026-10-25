// ABOUTME: Media query rewriter — normalize prefers-color-scheme for forced-dark.
// ABOUTME: (prefers-color-scheme: dark) → screen, light → not all, compounds unchanged.

/**
 * Rewrite a complete media query to force dark mode on screen.
 *
 * - Exact match `(prefers-color-scheme: dark)` → `screen`
 * - Exact match `(prefers-color-scheme: light)` → `not all`
 * - Compound queries (with `and`/`or`) → null (unchanged, may warn)
 * - Other queries → null (unchanged)
 *
 * Comparison is normalized for whitespace and case.
 */
export function rewriteColorSchemeMedia(mediaText: string): string | null {
  // Normalize: lowercase, collapse all whitespace except within tokens, trim
  const normalized = mediaText
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // first pass: collapse multiple spaces to single space
    .replace(/\s*\(\s*/g, '(') // remove space after (
    .replace(/\s*\)\s*/g, ')') // remove space before )
    .replace(/\s*:\s*/g, ': ') // normalize colon spacing to ': '
    .trim();

  if (normalized === '(prefers-color-scheme: dark)') {
    return 'screen';
  }
  if (normalized === '(prefers-color-scheme: light)') {
    return 'not all';
  }

  return null;
}

/**
 * Check if a media query is width-only (contains only min-width/max-width with and).
 * Used for media-to-container rewrite in future units.
 */
export function isWidthOnlyMedia(mediaText: string): boolean {
  const trimmed = mediaText.trim();
  const widthOnly = /^\(\s*(min|max)-width\s*:[^)]*\)(\s+and\s+\(\s*(min|max)-width\s*:[^)]*\))*$/.test(trimmed);
  return widthOnly;
}
