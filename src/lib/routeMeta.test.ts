// ABOUTME: Tests metaFor(pathname) against every row of #70's titles-and-descriptions table,
// ABOUTME: plus unknown slugs and dates (404 row) and the legacy URLs (their redirect target's row).
import { describe, expect, it } from 'vitest';
import { metaFor } from './routeMeta';

const LEDE =
  'Dinnaga Research reads the papers, podcasts and vendor docs, tests what they claim, and publishes what holds up.';
const NOT_FOUND = {
  title: 'Page not found · Dinnaga Research',
  description: "There's nothing at this address.",
  noindex: true,
};

describe('metaFor, one case per row of #70', () => {
  const rows: [string, { title: string; description: string; noindex: boolean }][] = [
    ['/', { title: 'Dinnaga Research', description: LEDE, noindex: false }],
    [
      '/atisha',
      {
        title: 'Atisha · Dinnaga Research',
        description: 'The public library. Every document here was tested before it was published, and says how.',
        noindex: false,
      },
    ],
    [
      '/atisha/slamwich-tasting-report',
      {
        title: 'SLAMWICH tasting report · Atisha · Dinnaga Research',
        description: 'What 28 acclaimed portfolio sites have in common, and which techniques do the most work.',
        noindex: false,
      },
    ],
    [
      '/building',
      {
        title: "What we're building · Dinnaga Research",
        description: 'Recent repositories, Substack posts and public gists from Dinnaga Research.',
        noindex: false,
      },
    ],
    [
      '/method',
      {
        title: 'How we test · Dinnaga Research',
        description: 'We build every idea before we write about it, and most die in the trying.',
        noindex: false,
      },
    ],
    [
      '/colophon',
      { title: 'Colophon · Dinnaga Research', description: 'How this site is built, set and hosted.', noindex: false },
    ],
    [
      '/backstage',
      {
        title: 'Behind the scenes · Dinnaga Research',
        description:
          "Docs we haven't published to Atisha, and the paused weekly archive. These pages are unlisted, and their files are public in the site's source.",
        noindex: true,
      },
    ],
    [
      '/backstage/weekly',
      {
        title: 'Weekly reports · Behind the scenes · Dinnaga Research',
        description: 'The paused weekly archive.',
        noindex: true,
      },
    ],
    [
      '/backstage/weekly/2026-08-08',
      {
        title: 'Weekly report, 3–8 Aug 2026 · Dinnaga Research',
        description: 'The paused weekly archive.',
        noindex: true,
      },
    ],
    ['/no-such-page', NOT_FOUND],
    ['/loadout', NOT_FOUND],
  ];

  for (const [path, meta] of rows) {
    it(path, () => {
      expect(metaFor(path)).toEqual(meta);
    });
  }

  it('an unpublished /backstage/:slug takes its title and one-liner, noindex', () => {
    const list = [
      {
        slug: 'draft',
        title: 'A draft',
        project: 'Test',
        summary: 'A one-liner.',
        published: '2026-01-01',
        docPath: '/artifact-docs/x.html',
        note: '',
      },
    ];
    expect(metaFor('/backstage/draft', list)).toEqual({
      title: 'A draft · Behind the scenes · Dinnaga Research',
      description: 'A one-liner.',
      noindex: true,
    });
    expect(metaFor('/atisha/draft', list)).toEqual(NOT_FOUND);
  });
});

describe('metaFor, edges', () => {
  it('unknown slugs and dates take the 404 row', () => {
    expect(metaFor('/atisha/no-such-doc')).toEqual(NOT_FOUND);
    expect(metaFor('/atisha/2026-08-08')).toEqual(NOT_FOUND);
    expect(metaFor('/backstage/no-such-doc')).toEqual(NOT_FOUND);
    expect(metaFor('/backstage/weekly/2026-01-01')).toEqual(NOT_FOUND);
  });

  it('a published /backstage/:slug takes the Atisha row it redirects to', () => {
    expect(metaFor('/backstage/slamwich-tasting-report')).toEqual(metaFor('/atisha/slamwich-tasting-report'));
  });

  it('legacy URLs take their redirect target row', () => {
    expect(metaFor('/artifacts')).toEqual(metaFor('/backstage'));
    expect(metaFor('/artifacts/slamwich-tasting-report')).toEqual(metaFor('/atisha/slamwich-tasting-report'));
    expect(metaFor('/weekly')).toEqual(metaFor('/backstage/weekly'));
    expect(metaFor('/weekly/2026-08-08')).toEqual(metaFor('/backstage/weekly/2026-08-08'));
  });

  it('ignores a trailing slash', () => {
    expect(metaFor('/atisha/')).toEqual(metaFor('/atisha'));
  });
});
