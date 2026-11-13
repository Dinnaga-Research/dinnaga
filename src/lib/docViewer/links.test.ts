// ABOUTME: Tests for link classification — anchor, SPA, and browser navigation.
// ABOUTME: Covers: anchor fragments, SPA routes, modifier keys, external links.
import { expect, test } from 'vitest';
import { classifyLink } from './links';

const docUrl = new URL('http://localhost/artifacts/test');

test('anchor: fragment link #id', () => {
  const url = new URL('#section', docUrl);
  expect(
    classifyLink(url, { button: 0, modifiers: false }, docUrl),
  ).toBe('anchor');
});

test('anchor: current doc URL with hash', () => {
  const url = new URL(docUrl.href + '#c07');
  expect(
    classifyLink(url, { button: 0, modifiers: false }, docUrl),
  ).toBe('anchor');
});

test('SPA: /artifacts route with _top target', () => {
  const url = new URL('http://localhost/artifacts/llm-best-practices-github-copilot');
  expect(
    classifyLink(url, { button: 0, modifiers: false, target: '_top' }, docUrl),
  ).toBe('spa');
});

test('SPA: /weekly route', () => {
  const url = new URL('http://localhost/weekly/2026-08-08');
  expect(
    classifyLink(url, { button: 0, modifiers: false }, docUrl),
  ).toBe('spa');
});

test('browser: /artifact-docs/ path', () => {
  const url = new URL('http://localhost/artifact-docs/slamwich-tasting-report.html');
  expect(
    classifyLink(url, { button: 0, modifiers: false }, docUrl),
  ).toBe('browser');
});

test('browser: Meta/Ctrl held', () => {
  const url = new URL('http://localhost/artifacts/other');
  expect(
    classifyLink(url, { button: 0, modifiers: true }, docUrl),
  ).toBe('browser');
});

test('browser: https://example.com external link', () => {
  const url = new URL('https://example.com/page');
  expect(
    classifyLink(url, { button: 0, modifiers: false }, docUrl),
  ).toBe('browser');
});

test('browser: target="_blank"', () => {
  const url = new URL('http://localhost/weekly');
  expect(
    classifyLink(url, { button: 0, modifiers: false, target: '_blank' }, docUrl),
  ).toBe('browser');
});

test('browser: middle mouse button', () => {
  const url = new URL('http://localhost/artifacts/other');
  expect(
    classifyLink(url, { button: 1, modifiers: false }, docUrl),
  ).toBe('browser');
});

test('browser: download attribute', () => {
  const url = new URL('http://localhost/artifacts/other');
  expect(
    classifyLink(url, { button: 0, modifiers: false, download: true }, docUrl),
  ).toBe('browser');
});

test('browser: path with file extension .pdf', () => {
  const url = new URL('http://localhost/docs/file.pdf');
  expect(
    classifyLink(url, { button: 0, modifiers: false }, docUrl),
  ).toBe('browser');
});

test('SPA: /method route (no extension)', () => {
  const url = new URL('http://localhost/method');
  expect(
    classifyLink(url, { button: 0, modifiers: false }, docUrl),
  ).toBe('spa');
});

// The ticket #48 table, against a real doc URL
const copilot = new URL('http://localhost:4242/artifact-docs/llm-best-practices-copilot-studio.html');
const base = { button: 0, modifiers: false };

test('table: GitHub Copilot sheet with target=_top is spa', () => {
  const url = new URL('/artifacts/llm-best-practices-github-copilot', copilot);
  expect(classifyLink(url, { ...base, target: '_top' }, copilot)).toBe('spa');
});

test('table: /artifact-docs/slamwich-tasting-report.html is browser', () => {
  const url = new URL('/artifact-docs/slamwich-tasting-report.html', copilot);
  expect(classifyLink(url, base, copilot)).toBe('browser');
});

test('table: #c07 is anchor, with Meta held is browser', () => {
  const url = new URL('#c07', copilot);
  expect(classifyLink(url, base, copilot)).toBe('anchor');
  expect(classifyLink(url, { ...base, modifiers: true }, copilot)).toBe('browser');
});

test('table: https://example.com with no target is browser; /weekly with _blank is browser', () => {
  expect(classifyLink(new URL('https://example.com'), base, copilot)).toBe('browser');
  expect(classifyLink(new URL('/weekly', copilot), { ...base, target: '_blank' }, copilot)).toBe('browser');
});

test('table: _self and _parent are spa, a named target is browser', () => {
  const url = new URL('/weekly', copilot);
  expect(classifyLink(url, { ...base, target: '_self' }, copilot)).toBe('spa');
  expect(classifyLink(url, { ...base, target: '_parent' }, copilot)).toBe('spa');
  expect(classifyLink(url, { ...base, target: 'somewhere' }, copilot)).toBe('browser');
});

test('table: non-primary button and download are browser even for anchors', () => {
  const url = new URL('#c07', copilot);
  expect(classifyLink(url, { button: 2, modifiers: false }, copilot)).toBe('browser');
  expect(classifyLink(url, { ...base, download: true }, copilot)).toBe('browser');
});

test('table: a different doc path with a hash is not an anchor; an extension makes it browser', () => {
  expect(classifyLink(new URL('/weekly/2026-08-08#x', copilot), base, copilot)).toBe('spa');
  expect(classifyLink(new URL('/files/report.pdf', copilot), base, copilot)).toBe('browser');
  expect(classifyLink(new URL('/artifacts/', copilot), base, copilot)).toBe('spa');
});
