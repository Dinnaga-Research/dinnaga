// ABOUTME: Tests the Doc catalogue: the publish flag, the launch set's exact strings (#63),
// ABOUTME: the published/unpublished helpers and that every docPath is a real file outside the routes.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { DocEntry } from '../types';
import { DOCS, docBySlug, publishedDocs, unpublishedDocs } from './docs';

const PUBLIC_DIR = join(__dirname, '..', '..', 'public');

const fixture = (over: Partial<DocEntry> & { slug: string }): DocEntry => ({
  title: `Title ${over.slug}`,
  project: 'Test',
  summary: 'A summary.',
  published: '2026-01-01',
  docPath: '/artifact-docs/x.html',
  note: '',
  ...over,
});

describe('publishedDocs', () => {
  it('returns the launch set, newest first, ties by title A to Z', () => {
    expect(publishedDocs().map((d) => d.slug)).toEqual([
      'llm-best-practices-github-copilot',
      'llm-best-practices-copilot-studio',
      'slamwich-tasting-report',
    ]);
  });

  it('leaves out an entry without publish', () => {
    const list = [
      fixture({ slug: 'a', publish: true, kind: 'Report', tested: 'Checked.' }),
      fixture({ slug: 'b' }),
    ];
    expect(publishedDocs(list).map((d) => d.slug)).toEqual(['a']);
  });

  it('orders a fixture by date then title', () => {
    const pub = { publish: true as const, kind: 'Report' as const, tested: 'Checked.' };
    const list = [
      fixture({ slug: 'old', published: '2026-01-01', ...pub }),
      fixture({ slug: 'z', title: 'Zebra', published: '2026-02-01', ...pub }),
      fixture({ slug: 'a', title: 'Aardvark', published: '2026-02-01', ...pub }),
    ];
    expect(publishedDocs(list).map((d) => d.slug)).toEqual(['a', 'z', 'old']);
  });
});

describe('unpublishedDocs', () => {
  it('is empty for the launch set', () => {
    expect(unpublishedDocs()).toEqual([]);
  });

  it('returns only the entries without publish', () => {
    const list = [fixture({ slug: 'a', publish: true, kind: 'Report', tested: 'x' }), fixture({ slug: 'b' })];
    expect(unpublishedDocs(list).map((d) => d.slug)).toEqual(['b']);
  });
});

describe('docBySlug', () => {
  it('finds a doc by slug and returns undefined for an unknown one', () => {
    expect(docBySlug('slamwich-tasting-report')?.title).toBe('SLAMWICH tasting report');
    expect(docBySlug('no-such-doc')).toBeUndefined();
  });
});

describe('the launch set (#63)', () => {
  it('every published entry has a non-empty kind, summary and tested line', () => {
    for (const d of DOCS.filter((x) => x.publish)) {
      expect(d.kind, d.slug).toBeTruthy();
      expect(d.summary, d.slug).toBeTruthy();
      expect(d.tested, d.slug).toBeTruthy();
    }
  });

  it('matches the table exactly', () => {
    const rows = DOCS.map(({ slug, title, kind, summary, tested, note, published, docPath, publish }) => ({
      slug,
      title,
      kind,
      summary,
      tested,
      note,
      published,
      docPath,
      publish,
    }));
    expect(rows).toEqual([
      {
        slug: 'llm-best-practices-github-copilot',
        title: 'Applying LLM best practices in GitHub Copilot',
        kind: 'Cheat sheet',
        summary:
          'Twelve LLM best practices, each mapped to a setting, file or fence you can use in GitHub Copilot today.',
        tested: 'Every control name checked against GitHub Docs on 9 Sep 2026.',
        note: 'GitHub Copilot changes often, so check a control again before you set policy on it.',
        published: '2026-09-09',
        docPath: '/artifact-docs/llm-best-practices-github-copilot.html',
        publish: true,
      },
      {
        slug: 'llm-best-practices-copilot-studio',
        title: 'Applying LLM best practices in Microsoft Copilot Studio',
        kind: 'Cheat sheet',
        summary:
          "The same twelve practices mapped onto Copilot Studio's controls, from topics and knowledge sources to DLP and the credit meter.",
        tested: 'Every control name checked against Microsoft Learn on 9 Sep 2026.',
        note: 'Copilot Studio changes often, so check a control again before you set policy on it.',
        published: '2026-09-09',
        docPath: '/artifact-docs/llm-best-practices-copilot-studio.html',
        publish: true,
      },
      {
        slug: 'slamwich-tasting-report',
        title: 'SLAMWICH tasting report',
        kind: 'Report',
        summary: 'What 28 acclaimed portfolio sites have in common, and which techniques do the most work.',
        tested: '84 rebuilds of the 28 sites with the same content, compared trait by trait.',
        note: "Links to individual rebuilds point at a local development server (localhost:9021), so they don't open from this site.",
        published: '2026-08-08',
        docPath: '/artifact-docs/slamwich-tasting-report.html',
        publish: true,
      },
    ]);
  });
});

describe('the catalogue', () => {
  it('slugs are unique, and none is "weekly" (it would shadow /backstage/weekly)', () => {
    const slugs = DOCS.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).not.toContain('weekly');
  });

  it('every entry has non-empty core fields and an ISO published date', () => {
    for (const d of DOCS) {
      for (const field of ['slug', 'title', 'project', 'summary', 'docPath'] as const) {
        expect(d[field], `${d.slug} ${field}`).not.toBe('');
      }
      expect(d.published).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('every docPath is root-relative and resolves to a file under public/', () => {
    for (const d of DOCS) {
      expect(d.docPath.startsWith('/')).toBe(true);
      expect(existsSync(join(PUBLIC_DIR, d.docPath)), d.docPath).toBe(true);
    }
  });

  it('no docPath lives inside a route namespace', () => {
    // A static host's extensionless resolution would let /atisha/<slug>.html shadow the route.
    for (const d of DOCS) {
      for (const prefix of ['/atisha/', '/backstage/', '/artifacts/', '/weekly/']) {
        expect(d.docPath.startsWith(prefix), `${d.docPath} under ${prefix}`).toBe(false);
      }
    }
  });
});
