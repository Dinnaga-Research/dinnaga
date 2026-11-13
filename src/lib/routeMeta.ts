// ABOUTME: metaFor(pathname): the <title>, description and noindex flag for every route (#70's table).
// ABOUTME: Pure; Layout applies it on each location change. Unknown paths take the 404 row.
import { LEDE } from '../data/copy';
import { DOCS, docBySlug, isPublished } from '../data/docs';
import { weeklyRunByDate } from '../data/weeklyRuns';
import type { DocEntry } from '../types';
import { formatDateRange } from './dateFormat';
import { legacyTarget } from './legacyRedirects';

export interface RouteMeta {
  title: string;
  description: string;
  noindex: boolean;
}

const SITE = 'Dinnaga Research';
const WEEKLY_DESCRIPTION = 'The paused weekly archive.';

const page = (title: string, description: string, noindex = false): RouteMeta => ({
  title: `${title} · ${SITE}`,
  description,
  noindex,
});

export const NOT_FOUND_META = page('Page not found', "There's nothing at this address.", true);

const STATIC: Record<string, RouteMeta> = {
  '/': { title: SITE, description: LEDE, noindex: false },
  '/atisha': page(
    'Atisha',
    'The public library. Every document here was tested before it was published, and says how.',
  ),
  '/building': page(
    "What we're building",
    'Recent repositories, Substack posts and public gists from Dinnaga Research.',
  ),
  '/method': page('How we test', 'We build every idea before we write about it, and most die in the trying.'),
  '/colophon': page('Colophon', 'How this site is built, set and hosted.'),
  '/backstage': page(
    'Behind the scenes',
    "Docs we haven't published to Atisha, and the paused weekly archive. These pages are unlisted, and their files are public in the site's source.",
    true,
  ),
  '/backstage/weekly': page('Weekly reports · Behind the scenes', WEEKLY_DESCRIPTION, true),
};

export function metaFor(pathname: string, docs: DocEntry[] = DOCS): RouteMeta {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const fixed = STATIC[path];
  if (fixed) return fixed;

  const legacy = legacyTarget(path, docs);
  if (legacy) return metaFor(legacy, docs);

  const parts = path.split('/').filter(Boolean);
  if (parts.length === 2 && parts[0] === 'atisha') {
    const doc = docBySlug(parts[1], docs);
    if (doc && isPublished(doc)) return page(`${doc.title} · Atisha`, doc.summary);
  }
  if (parts.length === 2 && parts[0] === 'backstage') {
    const doc = docBySlug(parts[1], docs);
    if (doc && isPublished(doc)) return metaFor(`/atisha/${doc.slug}`, docs);
    if (doc) return page(`${doc.title} · Behind the scenes`, doc.summary, true);
  }
  if (parts.length === 3 && parts[0] === 'backstage' && parts[1] === 'weekly') {
    const run = weeklyRunByDate(parts[2]!);
    if (run) return page(`Weekly report, ${formatDateRange(run.windowStart, run.date)}`, WEEKLY_DESCRIPTION, true);
  }
  if (parts[0] === 'dev') return { title: `Dev · ${SITE}`, description: LEDE, noindex: true };
  return NOT_FOUND_META;
}
