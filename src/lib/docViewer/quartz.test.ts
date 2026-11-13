// ABOUTME: Tests for the Quartz helpers — article-only extraction, internal link rewriting, callouts.
// ABOUTME: Runs on the committed synthetic fixture (tests/fixtures/quartz), never on real notes.
import { afterEach, describe, expect, test, vi } from 'vitest';
import { adaptDoc } from './adapter';
import {
  extractArticle,
  isQuartzDoc,
  prepareCallouts,
  quartzDocPath,
  rewriteInternalLinks,
  toggleCallout,
} from './quartz';
import { fixturePages, fixtureUrl, readFixture, stubFixtureFetch } from '../../test/quartzFixture';

afterEach(() => {
  vi.unstubAllGlobals();
});

function parse(build: 'build-a' | 'build-b', page: string): Document {
  return new DOMParser().parseFromString(readFixture(build, page), 'text/html');
}

function lastIndex<T>(items: T[], pred: (item: T) => boolean): number {
  for (let i = items.length - 1; i >= 0; i--) if (pred(items[i]!)) return i;
  return -1;
}

const harnessRoute = (slug: string, hash: string) =>
  '/dev/doc?path=' + encodeURIComponent(`/__fixtures__/quartz/build-b/${slug}.html`) + hash;

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

describe('internal links (#51)', () => {
  test('the slug-to-doc-path function appends .html under the base', () => {
    expect(quartzDocPath('/__fixtures__/quartz/build-b', 'tools/ripgrep')).toBe(
      '/__fixtures__/quartz/build-b/tools/ripgrep.html',
    );
  });

  test('every a.internal[data-slug] href becomes the harness route for its slug, keeping #heading', () => {
    const doc = parse('build-b', 'index.html');
    const docUrl = fixtureUrl('build-b', 'index.html');
    const before = [...doc.querySelectorAll('a.internal[data-slug]')].map((a) => ({
      slug: a.getAttribute('data-slug')!,
      hash: new URL(a.getAttribute('href')!, docUrl).hash,
    }));
    expect(before.length).toBeGreaterThan(1);
    expect(before.some((b) => b.hash !== '')).toBe(true);

    rewriteInternalLinks(doc.body, docUrl, harnessRoute);

    const after = [...doc.querySelectorAll('a.internal[data-slug]')];
    expect(after).toHaveLength(before.length);
    after.forEach((a, i) => {
      expect(a.getAttribute('href')).toBe(harnessRoute(before[i]!.slug, before[i]!.hash));
    });
  });

  test('external links and in-page # links are unchanged', () => {
    const doc = parse('build-b', 'index.html');
    const docUrl = fixtureUrl('build-b', 'index.html');
    const snapshot = (sel: string) => [...doc.querySelectorAll(sel)].map((a) => a.getAttribute('href'));
    const external = snapshot('a.external');
    const inPage = snapshot('a[href^="#"]');
    expect(external.length).toBeGreaterThan(0);
    expect(inPage.length).toBeGreaterThan(0);
    rewriteInternalLinks(doc.body, docUrl, harnessRoute);
    expect(snapshot('a.external')).toEqual(external);
    expect(snapshot('a[href^="#"]')).toEqual(inPage);
  });

  test('a tag link (no data-slug) gets the same treatment', () => {
    const doc = parse('build-b', 'index.html');
    const docUrl = fixtureUrl('build-b', 'index.html');
    rewriteInternalLinks(doc.body, docUrl, harnessRoute);
    expect(doc.querySelector('a.tag-link')!.getAttribute('href')).toBe(harnessRoute('tags/harbour', ''));
  });

  test('links in a nested folder page resolve to slugs from the site root', () => {
    const doc = parse('build-b', 'tools/ripgrep.html');
    const docUrl = fixtureUrl('build-b', 'tools/ripgrep.html');
    rewriteInternalLinks(doc.body, docUrl, harnessRoute);
    const hrefs = [...doc.querySelectorAll('a.internal')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain(harnessRoute('index', ''));
    expect(hrefs).toContain(harnessRoute('guides/tides', ''));
  });

  test('adaptDoc rewrites the links at load, before URLs are absolutised', async () => {
    stubFixtureFetch();
    const url = fixtureUrl('build-b', 'index.html');
    const adapted = await adaptDoc(url, { docUrl: url, toRoute: harnessRoute });
    const link = (adapted.content as DocumentFragment).querySelector('a[data-slug="tools/ripgrep"]')!;
    // Markup URLs are absolutised afterwards, so compare path, query and hash
    const href = new URL(link.getAttribute('href')!, url);
    expect(href.pathname + href.search + href.hash).toBe(harnessRoute('tools/ripgrep', ''));
  });
});

describe('collapsible callouts (#51)', () => {
  test('the callout title gets role, tabindex and aria-expanded', () => {
    const doc = parse('build-b', 'index.html');
    prepareCallouts(doc.body);
    const collapsible = [...doc.querySelectorAll('.callout.is-collapsible')];
    expect(collapsible.length).toBe(2);
    for (const c of collapsible) {
      const title = c.querySelector(':scope > .callout-title')!;
      expect(title.getAttribute('role')).toBe('button');
      expect(title.getAttribute('tabindex')).toBe('0');
      expect(title.getAttribute('aria-expanded')).toBe(c.classList.contains('is-collapsed') ? 'false' : 'true');
    }
    // A non-collapsible callout is left alone
    const plain = doc.querySelector('.callout:not(.is-collapsible) > .callout-title')!;
    expect(plain.hasAttribute('role')).toBe(false);
  });

  test('toggling flips is-collapsed and aria-expanded together', () => {
    const doc = parse('build-b', 'index.html');
    prepareCallouts(doc.body);
    const callout = doc.querySelector('.callout.is-collapsible')!;
    const title = callout.querySelector(':scope > .callout-title')!;
    expect(callout.classList.contains('is-collapsed')).toBe(true);
    expect(title.getAttribute('aria-expanded')).toBe('false');
    toggleCallout(callout);
    expect(callout.classList.contains('is-collapsed')).toBe(false);
    expect(title.getAttribute('aria-expanded')).toBe('true');
    toggleCallout(callout);
    expect(callout.classList.contains('is-collapsed')).toBe(true);
    expect(title.getAttribute('aria-expanded')).toBe('false');
  });

  test('the callout rules come after the Quartz overrides in the adapted sheet', async () => {
    stubFixtureFetch();
    const url = fixtureUrl('build-b', 'index.html');
    const adapted = await adaptDoc(url, { docUrl: url });
    const texts = [...adapted.sheet.cssRules].map((r) => r.cssText);
    const override = lastIndex(texts, (t: string) => t.startsWith('#quartz-body .center') && t.includes('max-width: 760px'));
    const fold = lastIndex(texts, (t: string) => t.startsWith('.callout.is-collapsed > .callout-content') && t.includes('display: none'));
    const focus = lastIndex(texts, (t: string) => t.includes('.callout-title[role="button"]:focus-visible'));
    expect(override).toBeGreaterThan(-1);
    expect(fold).toBeGreaterThan(override);
    expect(focus).toBeGreaterThan(override);
    expect(texts.length - 1 - focus).toBeLessThan(2);
  });
});
