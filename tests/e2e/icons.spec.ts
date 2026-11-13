// ABOUTME: E2E for the share card and favicon set (#72): each file is served as an image,
// ABOUTME: not answered with index.html by the SPA fallback.
import { expect, test } from '@playwright/test';

const FILES: { path: string; type: RegExp }[] = [
  { path: '/favicon.ico', type: /^image\/(x-icon|vnd\.microsoft\.icon)/ },
  { path: '/favicon.svg', type: /^image\/svg\+xml/ },
  { path: '/favicon-32.png', type: /^image\/png/ },
  { path: '/apple-touch-icon.png', type: /^image\/png/ },
  { path: '/og.png', type: /^image\/png/ },
];

for (const f of FILES) {
  test(`${f.path} is served as an image`, async ({ request }) => {
    const res = await request.get(f.path);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(f.type);
    expect((await res.body()).subarray(0, 15).toString('utf8')).not.toMatch(/<!doctype/i);
  });
}
