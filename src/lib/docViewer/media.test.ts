// ABOUTME: Tests for the media query rewriter — normalize color-scheme to forced-dark.
// ABOUTME: Covers: (prefers-color-scheme: dark) → screen, light → not all, compounds unchanged.
import { expect, test } from 'vitest';
import { rewriteColorSchemeMedia } from './media';

test('bare dark media query becomes screen', () => {
  const result = rewriteColorSchemeMedia('(prefers-color-scheme: dark)');
  expect(result).toBe('screen');
});

test('bare light media query becomes not all', () => {
  const result = rewriteColorSchemeMedia('(prefers-color-scheme: light)');
  expect(result).toBe('not all');
});

test('dark with extra spaces', () => {
  const result = rewriteColorSchemeMedia('(  prefers-color-scheme  :  dark  )');
  expect(result).toBe('screen');
});

test('light with extra spaces', () => {
  const result = rewriteColorSchemeMedia('(  prefers-color-scheme  :  light  )');
  expect(result).toBe('not all');
});

test('case insensitive dark', () => {
  const result = rewriteColorSchemeMedia('(prefers-color-scheme: DARK)');
  expect(result).toBe('screen');
});

test('case insensitive light', () => {
  const result = rewriteColorSchemeMedia('(prefers-color-scheme: LIGHT)');
  expect(result).toBe('not all');
});

test('compound dark query with and', () => {
  const result = rewriteColorSchemeMedia('(prefers-color-scheme: dark) and (min-width: 768px)');
  expect(result).toBeNull();
});

test('compound light query with and', () => {
  const result = rewriteColorSchemeMedia('screen and (prefers-color-scheme: light)');
  expect(result).toBeNull();
});

test('completely different query is unchanged', () => {
  const result = rewriteColorSchemeMedia('(min-width: 768px)');
  expect(result).toBeNull();
});

test('query without prefers-color-scheme unchanged', () => {
  const result = rewriteColorSchemeMedia('screen and (color)');
  expect(result).toBeNull();
});

test('unknown prefers-color-scheme value returns null (warning case)', () => {
  const result = rewriteColorSchemeMedia('(prefers-color-scheme: contrast)');
  expect(result).toBeNull();
});
