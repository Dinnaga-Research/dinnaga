// ABOUTME: Tests for SPA shell detection — identify the index.html shell vs. real docs.
// ABOUTME: Covers: #root exists → true, real docs → false.
import { expect, test } from 'vitest';
import { isSpaShell } from './shell';
// @ts-expect-error - jsdom types not available in test environment
import { JSDOM } from 'jsdom';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

test('detects SPA shell with #root', () => {
  const dom = new JSDOM('<body><div id="root">app</div></body>');
  expect(isSpaShell(dom.window.document)).toBe(true);
});

test('detects SPA shell with nested #root', () => {
  const dom = new JSDOM('<body><section><div id="root"></div></section></body>');
  expect(isSpaShell(dom.window.document)).toBe(true);
});

test('real doc without #root is not a shell', () => {
  const dom = new JSDOM('<body><h1>Title</h1><p>Content</p></body>');
  expect(isSpaShell(dom.window.document)).toBe(false);
});

test('repo index.html is a shell', () => {
  const html = readFileSync(join(process.cwd(), 'index.html'), 'utf-8');
  const dom = new JSDOM(html);
  expect(isSpaShell(dom.window.document)).toBe(true);
});

test('SLAMWICH doc is not a shell', () => {
  const html = readFileSync(
    join(process.cwd(), 'public/artifact-docs/slamwich-tasting-report.html'),
    'utf-8',
  );
  const dom = new JSDOM(html);
  expect(isSpaShell(dom.window.document)).toBe(false);
});

test('Copilot Studio doc is not a shell', () => {
  const html = readFileSync(
    join(process.cwd(), 'public/artifact-docs/llm-best-practices-copilot-studio.html'),
    'utf-8',
  );
  const dom = new JSDOM(html);
  expect(isSpaShell(dom.window.document)).toBe(false);
});

test('GitHub Copilot doc is not a shell', () => {
  const html = readFileSync(
    join(process.cwd(), 'public/artifact-docs/llm-best-practices-github-copilot.html'),
    'utf-8',
  );
  const dom = new JSDOM(html);
  expect(isSpaShell(dom.window.document)).toBe(false);
});

test('weekly report 2026-08-08 is not a shell', () => {
  const html = readFileSync(
    join(process.cwd(), 'public/artifact-docs/weekly/2026-08-08.html'),
    'utf-8',
  );
  const dom = new JSDOM(html);
  expect(isSpaShell(dom.window.document)).toBe(false);
});

test('each of the 11 real docs is not a shell', () => {
  const dirs = ['public/artifact-docs', 'public/artifact-docs/weekly'];
  const files = dirs.flatMap((d) =>
    readdirSync(join(process.cwd(), d))
      .filter((f) => f.endsWith('.html'))
      .map((f) => join(process.cwd(), d, f)),
  );
  expect(files).toHaveLength(11);
  for (const f of files) {
    expect(isSpaShell(new JSDOM(readFileSync(f, 'utf-8')).window.document), f).toBe(false);
  }
});
