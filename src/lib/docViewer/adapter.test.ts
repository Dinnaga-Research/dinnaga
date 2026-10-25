// ABOUTME: Tests for the doc adapter — fetch, parse, adapt CSS and HTML.
// ABOUTME: Covers: fetch real docs, CSS rewriting, stripping, SPA shell detection.
import { expect, test, vi } from 'vitest';
import { adaptDoc } from './adapter';
import { readFileSync } from 'fs';
import { join } from 'path';

// Helper to read a real doc
function readDoc(name: string): string {
  return readFileSync(join(process.cwd(), `public/artifact-docs/${name}`), 'utf-8');
}

test('adapts SLAMWICH doc without throwing', async () => {
  const slamwichHtml = readDoc('slamwich-tasting-report.html');

  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: vi.fn().mockResolvedValue(slamwichHtml),
  });

  global.fetch = mockFetch;

  const result = await adaptDoc(
    new URL('http://localhost:4242/artifact-docs/slamwich-tasting-report.html'),
    { docUrl: new URL('http://localhost:4242/artifact-docs/slamwich-tasting-report.html') },
  );

  expect(result.content).toBeTruthy();
  expect(result.sheet).toBeTruthy();
  expect(result.isQuartz).toBe(false);
});

test('adapts Copilot Studio doc', async () => {
  const copilotHtml = readDoc('llm-best-practices-copilot-studio.html');

  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: vi.fn().mockResolvedValue(copilotHtml),
  });

  global.fetch = mockFetch;

  const result = await adaptDoc(
    new URL('http://localhost:4242/artifact-docs/llm-best-practices-copilot-studio.html'),
    { docUrl: new URL('http://localhost:4242/artifact-docs/llm-best-practices-copilot-studio.html') },
  );

  expect(result.content).toBeTruthy();
  expect(result.isQuartz).toBe(false);
});

test('rejects SPA shell (index.html)', async () => {
  const shellHtml = readFileSync(join(process.cwd(), 'index.html'), 'utf-8');

  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: vi.fn().mockResolvedValue(shellHtml),
  });

  global.fetch = mockFetch;

  try {
    await adaptDoc(
      new URL('http://localhost:4242/index.html'),
      { docUrl: new URL('http://localhost:4242/index.html') },
    );
    expect.fail('should have thrown');
  } catch (e) {
    expect((e as Error).message).toContain('SPA shell');
  }
});

test('rejects non-OK status', async () => {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: false,
    status: 404,
    text: vi.fn().mockResolvedValue('Not found'),
  });

  global.fetch = mockFetch;

  try {
    await adaptDoc(
      new URL('http://localhost:4242/missing.html'),
      { docUrl: new URL('http://localhost:4242/missing.html') },
    );
    expect.fail('should have thrown');
  } catch (e) {
    expect((e as Error).message).toMatch(/status|404/);
  }
});

test('respects AbortSignal', async () => {
  const ctl = new AbortController();

  const mockFetch = vi.fn(() => {
    ctl.abort();
    return Promise.reject(new DOMException('Aborted', 'AbortError'));
  });

  global.fetch = mockFetch;

  try {
    await adaptDoc(
      new URL('http://localhost:4242/artifact-docs/slamwich-tasting-report.html'),
      {
        docUrl: new URL('http://localhost:4242/artifact-docs/slamwich-tasting-report.html'),
        signal: ctl.signal,
      },
    );
  } catch (e) {
    // AbortError is expected
    expect((e as Error).name).toBe('AbortError');
  }
});

test('returns AdaptedDoc with required fields', async () => {
  const slamwichHtml = readDoc('slamwich-tasting-report.html');

  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: vi.fn().mockResolvedValue(slamwichHtml),
  });

  global.fetch = mockFetch;

  const result = await adaptDoc(
    new URL('http://localhost:4242/artifact-docs/slamwich-tasting-report.html'),
    { docUrl: new URL('http://localhost:4242/artifact-docs/slamwich-tasting-report.html') },
  );

  // Verify all required fields exist
  expect(result.content).toBeTruthy();
  expect(result.sheet).toBeTruthy();
  expect(typeof result.isQuartz).toBe('boolean');
  expect(['string', 'object'].includes(typeof result.family) || result.family === null).toBe(true);
  expect(typeof result.bodyAttrs).toBe('object');
  expect(typeof result.hostAttrs).toBe('object');

  // content should be a DocumentFragment or Element
  expect(result.content instanceof DocumentFragment || result.content instanceof Element).toBe(true);
});
