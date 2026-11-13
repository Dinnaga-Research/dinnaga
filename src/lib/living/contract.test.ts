// ABOUTME: Tests the isLiving guard against the committed fixtures and malformed bodies (#65's contract).
import { describe, expect, it } from 'vitest';
import full from '../../../tests/fixtures/living/full.json';
import failed from '../../../tests/fixtures/living/failed.json';
import empty from '../../../tests/fixtures/living/empty.json';
import { isLiving } from './contract';

describe('isLiving', () => {
  it('accepts the full, failed and empty fixtures', () => {
    expect(isLiving(full)).toBe(true);
    expect(isLiving(failed)).toBe(true);
    expect(isLiving(empty)).toBe(true);
  });

  it('rejects non-objects and missing sources', () => {
    for (const bad of [null, undefined, 'x', 1, [], {}, { ...full, posts: undefined }, { ...full, generatedAt: 5 }]) {
      expect(isLiving(bad)).toBe(false);
    }
  });

  it('rejects a source whose ok is not boolean or whose items is not an array', () => {
    expect(isLiving({ ...full, repos: { ok: 'yes', items: [] } })).toBe(false);
    expect(isLiving({ ...full, gists: { ok: true, items: null } })).toBe(false);
  });

  it('rejects malformed items', () => {
    const repo = full.repos.items[0]!;
    expect(isLiving({ ...full, repos: { ok: true, items: [{ ...repo, stars: '3' }] } })).toBe(false);
    expect(isLiving({ ...full, repos: { ok: true, items: [{ ...repo, release: 2 }] } })).toBe(false);
    expect(isLiving({ ...full, gists: { ok: true, items: [{ title: 'x', url: 'y' }] } })).toBe(false);
    expect(isLiving({ ...full, posts: { ok: true, items: [{ title: 'x', url: 'y', publishedAt: 1 }] } })).toBe(false);
  });
});
