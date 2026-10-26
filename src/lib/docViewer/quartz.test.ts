// ABOUTME: Tests for the Quartz helpers — article-only extraction, internal link rewriting, callouts.
// ABOUTME: Runs on the committed synthetic fixture (tests/fixtures/quartz), never on real notes.
import { afterEach, describe, expect, test, vi } from 'vitest';
import { adaptDoc } from './adapter';
import { extractArticle, isQuartzDoc } from './quartz';
import { fixturePages, fixtureUrl, readFixture, stubFixtureFetch } from '../../test/quartzFixture';

afterEach(() => {
  vi.unstubAllGlobals();
});

function parse(build: 'build-a' | 'build-b', page: string): Document {
  return new DOMParser().parseFromString(readFixture(build, page), 'text/html');
}

describe('generator detection and article-only extraction (#50)', () => {
  test('a Quartz page is detected by #quartz-root', () => {
    expect(isQuartzDoc(parse('build-a', 'index.html'))).toBe(true);
    expect(isQuartzDoc(new DOMParser().parseFromString('<p>x</p>', 'text/html'))).toBe(false);
  });

  for (const build of ['build-a', 'build-b'] as const) {
    test(`article-only extraction keeps one h1 and the article, no chrome (${build}, every page)`, () => {
      for (const page of fixturePages(build)) {
        const doc = parse(build, page);
        extractArticle(doc);
        const where = `${build}/${page}`;
        expect(doc.body.querySelectorAll('h1'), where).toHaveLength(1);
        expect(doc.body.querySelectorAll('h1.article-title'), where).toHaveLength(1);
        for (const sel of [
          '.sidebar',
          'footer',
          '.search',
          '.graph',
          '.explorer',
          '.backlinks',
          '.breadcrumb-container',
        ]) {
          expect(doc.body.querySelector(sel), `${where} ${sel}`).toBeNull();
        }
        // The wrapper chain the single-column overrides rely on
        expect(doc.body.querySelector('#quartz-root > #quartz-body > .center'), where).not.toBeNull();
        expect(doc.body.querySelector('#quartz-body')!.children).toHaveLength(1);
      }
    });
  }

  test('the article, content metadata and tags survive', () => {
    const doc = parse('build-b', 'index.html');
    extractArticle(doc);
    expect(doc.body.querySelectorAll('article')).toHaveLength(1);
    expect(doc.body.querySelector('.content-meta')).not.toBeNull();
    expect(doc.body.querySelector('a.tag-link')).not.toBeNull();
  });

  test('adaptDoc mounts a Quartz page article-only and appends the single-column overrides last', async () => {
    stubFixtureFetch();
    const url = fixtureUrl('build-a', 'index.html');
    const adapted = await adaptDoc(url, { docUrl: url });
    expect(adapted.isQuartz).toBe(true);
    const frag = adapted.content as DocumentFragment;
    expect(frag.querySelectorAll('h1')).toHaveLength(1);
    expect(frag.querySelectorAll('article')).toHaveLength(1);
    expect(frag.querySelector('.sidebar, footer, .search, .graph')).toBeNull();
    const rules = [...adapted.sheet.cssRules].map((r) => r.cssText);
    const tail = rules.slice(-12).join('\n');
    expect(tail).toContain('#quartz-body');
    expect(tail).toContain('max-width: 760px');
    expect(adapted.hostAttrs['saved-theme']).toBe('dark');
  });

  test('mermaid blocks are left as source', async () => {
    stubFixtureFetch();
    const url = fixtureUrl('build-b', 'index.html');
    const adapted = await adaptDoc(url, { docUrl: url });
    const code = (adapted.content as DocumentFragment).querySelector('code.mermaid');
    expect(code?.textContent).toContain('graph TD');
  });
});
