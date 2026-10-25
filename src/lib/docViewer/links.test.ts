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
