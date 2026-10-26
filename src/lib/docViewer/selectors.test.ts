// ABOUTME: Tests for the selector rewriter tokenizer — rewrite type selectors only.
// ABOUTME: Covers: html/:root → :host, body → doc-body, main → doc-main, with compounds.
import { expect, test } from 'vitest';
import { rewriteSelector } from './selectors';
import { readFileSync } from 'fs';
import { join } from 'path';

test('html alone becomes :host', () => {
  expect(rewriteSelector('html')).toBe(':host');
});

test(':root alone becomes :host', () => {
  expect(rewriteSelector(':root')).toBe(':host');
});

test('html with class compound becomes :host(.x)', () => {
  expect(rewriteSelector('html.x')).toBe(':host(.x)');
});

test('html with attribute compound becomes :host([x])', () => {
  expect(rewriteSelector('html[x]')).toBe(':host([x])');
});

test('html with :not() becomes :host(:not(.y))', () => {
  expect(rewriteSelector('html:not(.y)')).toBe(':host(:not(.y))');
});

test(':root with multiple compounds', () => {
  expect(rewriteSelector(':root.dark[data-theme]')).toBe(':host(.dark[data-theme])');
});

test('body alone becomes doc-body', () => {
  expect(rewriteSelector('body')).toBe('doc-body');
});

test('body with class stays as doc-body.x', () => {
  expect(rewriteSelector('body.dark')).toBe('doc-body.dark');
});

test('main alone becomes doc-main', () => {
  expect(rewriteSelector('main')).toBe('doc-main');
});

test('main with class becomes doc-main.x', () => {
  expect(rewriteSelector('main.content')).toBe('doc-main.content');
});

test('selector list with html', () => {
  expect(rewriteSelector('html, body')).toBe(':host, doc-body');
});

test('selector list with multiple rewrites', () => {
  expect(rewriteSelector('html.dark, body.light, main')).toBe(':host(.dark), doc-body.light, doc-main');
});

test('html after comma in list', () => {
  expect(rewriteSelector('p, html')).toBe('p, :host');
});

test('html after > combinator', () => {
  expect(rewriteSelector('div > html')).toBe('div > :host');
});

test('html after + combinator', () => {
  expect(rewriteSelector('div + html')).toBe('div + :host');
});

test('html after ~ combinator', () => {
  expect(rewriteSelector('div ~ html')).toBe('div ~ :host');
});

test('html inside :is()', () => {
  expect(rewriteSelector(':is(html)')).toBe(':is(:host)');
});

test('html inside :where()', () => {
  expect(rewriteSelector(':where(html)')).toBe(':where(:host)');
});

test('html inside :not()', () => {
  expect(rewriteSelector(':not(html)')).toBe(':not(:host)');
});

test('html inside :has()', () => {
  expect(rewriteSelector(':has(html)')).toBe(':has(:host)');
});

test('html with compound inside :is()', () => {
  expect(rewriteSelector(':is(html.dark)')).toBe(':is(:host(.dark))');
});

test('must-not-touch: .body class', () => {
  expect(rewriteSelector('.body')).toBe('.body');
});

test('must-not-touch: #main id', () => {
  expect(rewriteSelector('#main')).toBe('#main');
});

test('must-not-touch: .main-nav class', () => {
  expect(rewriteSelector('.main-nav')).toBe('.main-nav');
});

test('must-not-touch: tbody element', () => {
  expect(rewriteSelector('tbody')).toBe('tbody');
});

test('must-not-touch: data attribute with html value', () => {
  expect(rewriteSelector('[data-x="html"]')).toBe('[data-x="html"]');
});

test('must-not-touch: html inside string (double quotes)', () => {
  expect(rewriteSelector('a[href="http://html.example.com"]')).toBe('a[href="http://html.example.com"]');
});

test('must-not-touch: html inside string (single quotes)', () => {
  expect(rewriteSelector("a[href='http://html.example.com']")).toBe("a[href='http://html.example.com']");
});

test('must-not-touch: html in content string', () => {
  expect(rewriteSelector('p::before { content: "html" }')).toBe('p::before { content: "html" }');
});

test('must-not-touch: escaped character', () => {
  expect(rewriteSelector('html\\:root')).toBe('html\\:root');
});

test('real SLAMWICH selector list', async () => {
  const doc = readFileSync(
    join(process.cwd(), 'public/artifact-docs/slamwich-tasting-report.html'),
    'utf-8',
  );
  // Extract selectors from the doc to test against real content
  const selectors = extractSelectors(doc);
  for (const sel of selectors) {
    const rewritten = rewriteSelector(sel);
    // Just verify it doesn't throw and produces output
    expect(typeof rewritten).toBe('string');
  }
});

test('real Copilot Studio selector list', async () => {
  const doc = readFileSync(
    join(process.cwd(), 'public/artifact-docs/llm-best-practices-copilot-studio.html'),
    'utf-8',
  );
  const selectors = extractSelectors(doc);
  for (const sel of selectors) {
    const rewritten = rewriteSelector(sel);
    expect(typeof rewritten).toBe('string');
  }
});

test('real GitHub Copilot selector list', async () => {
  const doc = readFileSync(
    join(process.cwd(), 'public/artifact-docs/llm-best-practices-github-copilot.html'),
    'utf-8',
  );
  const selectors = extractSelectors(doc);
  for (const sel of selectors) {
    const rewritten = rewriteSelector(sel);
    expect(typeof rewritten).toBe('string');
  }
});

// UNIT-003 tests
test(':target becomes [data-doc-target]', () => {
  expect(rewriteSelector('.card:target')).toBe('.card[data-doc-target]');
});

test(':target in compound selector', () => {
  expect(rewriteSelector('.card:target.active')).toBe('.card[data-doc-target].active');
});

test('multiple :target in selector list', () => {
  expect(rewriteSelector('.card:target, div:target')).toBe('.card[data-doc-target], div[data-doc-target]');
});

test(':target is left alone inside strings and attribute brackets, and :target-within is not matched', () => {
  expect(rewriteSelector('[data-x=":target"]')).toBe('[data-x=":target"]');
  expect(rewriteSelector('.a[title=\'p:target\']:target')).toBe('.a[title=\'p:target\'][data-doc-target]');
  expect(rewriteSelector('.a:target-within')).toBe('.a:target-within');
});

// Helper to extract selectors from a document
function extractSelectors(html: string): string[] {
  const selectors: string[] = [];
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/g;
  let match;
  while ((match = styleRegex.exec(html))) {
    const css = match[1];
    if (!css) continue;
    const selectorRegex = /([^{]+)\s*\{/g;
    let sMatch;
    while ((sMatch = selectorRegex.exec(css))) {
      const selector = sMatch[1];
      if (selector && !selector.startsWith('@')) {
        selectors.push(selector.trim());
      }
    }
  }
  return selectors;
}

// Quartz theme-port selectors (#50)
test('Quartz: html[saved-theme] with descendant body keeps the attribute on the host', () => {
  expect(rewriteSelector('html[saved-theme="dark"] body .callout')).toBe(
    ':host([saved-theme="dark"]) doc-body .callout',
  );
});

test('Quartz: :root[saved-theme=dark] becomes :host([saved-theme=dark])', () => {
  expect(rewriteSelector(':root[saved-theme=dark]')).toBe(':host([saved-theme=dark])');
});

test('Quartz: html body>:not(.print) keeps the child combinator', () => {
  expect(rewriteSelector('html body>:not(.print)')).toBe(':host doc-body>:not(.print)');
});

test('Quartz: html>body>#main-horizontal with no spaces around the combinators', () => {
  expect(rewriteSelector('html>body>#main-horizontal')).toBe(':host>doc-body>#main-horizontal');
});

test('Quartz: body.theme-dark .x becomes doc-body.theme-dark .x', () => {
  expect(rewriteSelector('body.theme-dark .x')).toBe('doc-body.theme-dark .x');
});

test('Quartz: a[href$=".html"] and [data-slug="body"] are unchanged', () => {
  expect(rewriteSelector('a[href$=".html"]')).toBe('a[href$=".html"]');
  expect(rewriteSelector('[data-slug="body"]')).toBe('[data-slug="body"]');
});

test('Quartz: a leading [saved-theme=dark] attribute selector moves onto the host', () => {
  expect(rewriteSelector('[saved-theme=dark] code[data-theme*=\\ ]')).toBe(
    ':host([saved-theme=dark]) code[data-theme*=\\ ]',
  );
});

test('Quartz: :root:root[saved-theme="dark"] (a specificity bump) is one host, not :host(:root...)', () => {
  expect(rewriteSelector(':root:root[saved-theme="dark"]')).toBe(':host([saved-theme="dark"])');
  expect(rewriteSelector('html:root')).toBe(':host');
});

test('Quartz: a nested `& body` descendant after the parent selector becomes doc-body', () => {
  expect(rewriteSelector('& body[data-slug]')).toBe('& doc-body[data-slug]');
  expect(rewriteSelector('& body .page > div')).toBe('& doc-body .page > div');
});
