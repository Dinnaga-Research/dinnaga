// ABOUTME: Tests legacyTarget(): #64's redirect table from the old /artifacts and /weekly URLs.
import { describe, expect, it } from 'vitest';
import type { DocEntry } from '../types';
import { legacyTarget } from './legacyRedirects';

const draft: DocEntry = {
  slug: 'draft',
  title: 'A draft',
  project: 'Test',
  summary: 'x',
  published: '2026-01-01',
  docPath: '/artifact-docs/x.html',
  note: '',
};

describe('legacyTarget (#64)', () => {
  it('/artifacts goes to /backstage', () => {
    expect(legacyTarget('/artifacts')).toBe('/backstage');
  });

  it('/artifacts/:slug goes to Atisha when published', () => {
    expect(legacyTarget('/artifacts/slamwich-tasting-report')).toBe('/atisha/slamwich-tasting-report');
  });

  it('/artifacts/:slug goes Behind the scenes otherwise, unknown slugs included', () => {
    expect(legacyTarget('/artifacts/draft', [draft])).toBe('/backstage/draft');
    expect(legacyTarget('/artifacts/no-such-doc')).toBe('/backstage/no-such-doc');
  });

  it('/weekly and /weekly/:date go to /backstage/weekly', () => {
    expect(legacyTarget('/weekly')).toBe('/backstage/weekly');
    expect(legacyTarget('/weekly/2026-08-08')).toBe('/backstage/weekly/2026-08-08');
  });

  it('a trailing slash is tolerated; anything else is not a legacy URL', () => {
    expect(legacyTarget('/artifacts/')).toBe('/backstage');
    expect(legacyTarget('/atisha')).toBeNull();
    expect(legacyTarget('/artifacts/a/b')).toBeNull();
  });
});
