// ABOUTME: Tests for document stripping — remove scripts, handlers, javascript: URLs.
// ABOUTME: Covers: <script>, onclick/ONLOAD, href="javascript:alert(1)", main → doc-main.
import { expect, test } from 'vitest';
import { stripDocument, renameMain } from './strip';
// @ts-ignore - jsdom types not available in test environment
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { join } from 'path';

test('removes script elements', () => {
  const dom = new JSDOM('<body><script>alert("hi")</script><p>text</p></body>');
  stripDocument(dom.window.document);
  expect(dom.window.document.body.innerHTML).not.toContain('script');
  expect(dom.window.document.body.innerHTML).toContain('<p>text</p>');
});

test('removes noscript elements', () => {
  const dom = new JSDOM('<body><noscript>fallback</noscript><p>text</p></body>');
  stripDocument(dom.window.document);
  expect(dom.window.document.body.innerHTML).not.toContain('noscript');
});

test('removes link/meta/title/base from body', () => {
  const dom = new JSDOM(
    '<body><link rel="stylesheet"><meta name="test"><title>x</title><base href="/"><p>text</p></body>',
  );
  stripDocument(dom.window.document);
  const html = dom.window.document.body.innerHTML;
  expect(html).not.toContain('link');
  expect(html).not.toContain('meta');
  expect(html).not.toContain('title');
  expect(html).not.toContain('base');
  expect(html).toContain('<p>text</p>');
});

test('removes style elements from body', () => {
  const dom = new JSDOM('<body><style>body { color: red; }</style><p>text</p></body>');
  stripDocument(dom.window.document);
  expect(dom.window.document.body.innerHTML).not.toContain('style');
});

test('removes onclick handlers', () => {
  const dom = new JSDOM('<body><div onclick="alert(1)">x</div></body>');
  stripDocument(dom.window.document);
  expect(dom.window.document.body.innerHTML).not.toContain('onclick');
});

test('removes onerror handlers (case insensitive)', () => {
  const dom = new JSDOM('<body><img onerror="alert(1)" src="x"><img ONERROR="y" src="z"></body>');
  stripDocument(dom.window.document);
  const html = dom.window.document.body.innerHTML;
  expect(html).not.toContain('onerror');
  expect(html).not.toContain('ONERROR');
});

test('removes onload handlers', () => {
  const dom = new JSDOM('<body><div onload="init()">x</div></body>');
  stripDocument(dom.window.document);
  expect(dom.window.document.body.innerHTML).not.toContain('onload');
});

test('removes javascript: from href with spaces', () => {
  const dom = new JSDOM('<body><a href="  javascript:alert(1)">click</a></body>');
  stripDocument(dom.window.document);
  expect(dom.window.document.body.innerHTML).not.toContain('javascript:');
});

test('removes javascript: from src', () => {
  const dom = new JSDOM('<body><img src="javascript:alert(1)"></body>');
  stripDocument(dom.window.document);
  const src = dom.window.document.querySelector('img')?.getAttribute('src');
  // Should either be removed or not contain javascript:
  if (src !== null) {
    expect(src).not.toContain('javascript:');
  }
});

test('keeps normal http links', () => {
  const dom = new JSDOM('<body><a href="http://example.com">link</a></body>');
  stripDocument(dom.window.document);
  const href = dom.window.document.querySelector('a')?.getAttribute('href');
  expect(href).toBe('http://example.com');
});

test('renames main to doc-main', () => {
  const dom = new JSDOM('<body><main class="content"><h1>Title</h1></main></body>');
  renameMain(dom.window.document.body);
  const main = dom.window.document.querySelector('main');
  expect(main).toBeNull();
  const docMain = dom.window.document.querySelector('doc-main');
  expect(docMain).toBeTruthy();
  expect(docMain?.getAttribute('class')).toBe('content');
  expect(docMain?.innerHTML).toContain('<h1>Title</h1>');
});

test('renames all main elements', () => {
  const dom = new JSDOM('<body><main>1</main><article><main>2</main></article></body>');
  renameMain(dom.window.document.body);
  expect(dom.window.document.querySelectorAll('main')).toHaveLength(0);
  expect(dom.window.document.querySelectorAll('doc-main')).toHaveLength(2);
});

test('real SLAMWICH doc stripping', () => {
  const html = readFileSync(
    join(process.cwd(), 'public/artifact-docs/slamwich-tasting-report.html'),
    'utf-8',
  );
  const dom = new JSDOM(html);
  stripDocument(dom.window.document);
  // Should have no scripts, no noscript
  expect(dom.window.document.querySelectorAll('script')).toHaveLength(0);
  expect(dom.window.document.querySelectorAll('noscript')).toHaveLength(0);
  // Should have doc-main elements
  expect(dom.window.document.querySelectorAll('doc-main').length).toBeGreaterThan(0);
});

test('real Copilot Studio doc stripping', () => {
  const html = readFileSync(
    join(process.cwd(), 'public/artifact-docs/llm-best-practices-copilot-studio.html'),
    'utf-8',
  );
  const dom = new JSDOM(html);
  stripDocument(dom.window.document);
  expect(dom.window.document.querySelectorAll('script')).toHaveLength(0);
  expect(dom.window.document.querySelectorAll('noscript')).toHaveLength(0);
  expect(dom.window.document.querySelectorAll('doc-main').length).toBeGreaterThan(0);
});
