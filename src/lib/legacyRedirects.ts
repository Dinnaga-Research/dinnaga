// ABOUTME: #64's redirect table: where an old /artifacts or /weekly URL now lives.
// ABOUTME: Pure; LegacyRedirect renders it and routeMeta uses it for the target's metadata.
import { DOCS, docBySlug, isPublished } from '../data/docs';
import type { DocEntry } from '../types';

/** The new path for a legacy pathname, or null when the path is not a legacy URL. */
export function legacyTarget(pathname: string, docs: DocEntry[] = DOCS): string | null {
  const parts = pathname.split('/').filter(Boolean);
  const [root, rest, extra] = parts;
  if (extra !== undefined) return null;
  if (root === 'artifacts') {
    if (rest === undefined) return '/backstage';
    const doc = docBySlug(rest, docs);
    return doc && isPublished(doc) ? `/atisha/${rest}` : `/backstage/${rest}`;
  }
  if (root === 'weekly') return rest === undefined ? '/backstage/weekly' : `/backstage/weekly/${rest}`;
  return null;
}
