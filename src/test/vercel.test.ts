// ABOUTME: vercel.json guard (#65): one catch-all rewrite to the SPA shell that never swallows /api/.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const config = JSON.parse(readFileSync(join(__dirname, '..', '..', 'vercel.json'), 'utf8')) as {
  rewrites: { source: string; destination: string }[];
  redirects?: unknown;
};

describe('vercel.json', () => {
  it('has exactly one rewrite, to /index.html, and no redirects', () => {
    expect(config.rewrites).toHaveLength(1);
    expect(config.rewrites[0]!.destination).toBe('/index.html');
    expect(config.redirects).toBeUndefined();
  });

  it('rewrites page routes but not /api/', () => {
    const source = new RegExp(`^${config.rewrites[0]!.source}$`);
    expect(source.test('/atisha')).toBe(true);
    expect(source.test('/backstage/weekly/2026-08-08')).toBe(true);
    expect(source.test('/')).toBe(true);
    expect(source.test('/api/living')).toBe(false);
  });
});
