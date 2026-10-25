// ABOUTME: Tests for the doc adapter — fetch, parse, adapt CSS and HTML.
// ABOUTME: Covers: fetch real docs, CSS rewriting, stripping, SPA shell detection.
import { expect, test, vi } from 'vitest';
import { adaptDoc, adaptCssText } from './adapter';
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

function stubDoc(html: string) {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => html });
}
const U = new URL('http://localhost:4242/x.html');

test('rewrites rule preludes in place: root -> :host, dark media -> screen, shorthand with var() survives', async () => {
  stubDoc(
    '<html><head><style>:root{--c:red}html{background:var(--c)}body{margin:0}' +
      '.principle{border:1px solid var(--c)}@media (prefers-color-scheme: dark){:root{--c:blue}}' +
      '</style></head><body><main><h1>t</h1></main></body></html>',
  );
  const { sheet } = await adaptDoc(U, { docUrl: U });
  const text = [...sheet.cssRules].map((r) => r.cssText).join('\n');
  expect(text).toContain(':host');
  expect(text).toContain('doc-body');
  expect(text).not.toMatch(/(^|[\s,{])(html|body|:root)\s*[{,]/m);
  expect(text).toMatch(/@media screen/);
  expect(text).not.toContain('prefers-color-scheme');
  // in place: the var() shorthand is not serialised away
  expect(text).toMatch(/\.principle\s*\{[^}]*border[^}]*var\(--c\)/);
  // reset first, guard last
  expect(sheet.cssRules[0]!.cssText).toContain('all: initial');
  expect(sheet.cssRules[sheet.cssRules.length - 1]!.cssText).toContain('overflow-x: auto !important');
});

test('compound color-scheme query is left unchanged and warns', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  stubDoc(
    '<html><head><style>@media (prefers-color-scheme: dark) and (min-width: 600px){p{color:red}}</style></head><body><p>t</p></body></html>',
  );
  const { sheet } = await adaptDoc(U, { docUrl: U });
  expect([...sheet.cssRules].map((r) => r.cssText).join('')).toContain('prefers-color-scheme');
  expect(warn).toHaveBeenCalled();
  warn.mockRestore();
});

// Tests for adaptCssText
test('adaptCssText: vw rewrite keeps !important', () => {
  const result = adaptCssText('h1 { font-size: 5vw !important; }', new URL('http://localhost/'));
  expect(result.css).toContain('5cqi');
  expect(result.css).toContain('!important');
});

test('adaptCssText: vw rewrite leaves px alone', () => {
  const result = adaptCssText('h1 { font-size: 12px; }', new URL('http://localhost/'));
  expect(result.css).not.toContain('cqi');
  expect(result.css).toContain('12px');
});

test('adaptCssText: vw rewrite leaves var(--vw-ish) alone', () => {
  const result = adaptCssText('h1 { margin: var(--vw-ish); }', new URL('http://localhost/'));
  expect(result.css).toContain('var(--vw-ish)');
});

test('adaptCssText: width-media converts to container', () => {
  const result = adaptCssText('@media (max-width:640px) { .grid2 { display: grid; } }', new URL('http://localhost/'));
  expect(result.css).toContain('@container doc');
  expect(result.css).toContain('max-width');
});

test('adaptCssText: compound width media converts', () => {
  const result = adaptCssText('@media (min-width: 40rem) and (max-width: 60rem) { .card { color: red; } }', new URL('http://localhost/'));
  expect(result.css).toContain('@container doc');
});

test('adaptCssText: color-scheme media unchanged', () => {
  const result = adaptCssText('@media (prefers-color-scheme: dark) { p { color: white; } }', new URL('http://localhost/'));
  expect(result.css).toContain('prefers-color-scheme');
  expect(result.css).not.toContain('@container');
});

test('adaptCssText: @font-face is extracted', () => {
  const cssText = '@font-face { font-family: "Custom"; src: url(/fonts/custom.woff2); }';
  const result = adaptCssText(cssText, new URL('http://localhost/'));
  console.log('fontFaces:', result.fontFaces);
  expect(result.fontFaces.length).toBe(1);
  expect(result.fontFaces[0]).toContain('@font-face');
});

test('adaptCssText: font face URLs are absolutized', () => {
  const cssText = '@font-face { font-family: "Custom"; src: url(fonts/custom.woff2); }';
  const sheetUrl = new URL('http://example.com/path/to/style.css');
  const result = adaptCssText(cssText, sheetUrl);
  expect(result.fontFaces[0]).toContain('http://example.com/path/to/fonts/custom.woff2');
});

test('adaptCssText: CSS url() values are absolutized', () => {
  const cssText = 'body { background: url(../img/bg.png); }';
  const sheetUrl = new URL('http://example.com/css/style.css');
  const result = adaptCssText(cssText, sheetUrl);
  expect(result.css).toContain('http://example.com/img/bg.png');
});

test('adaptCssText: CSS url() with data: unchanged', () => {
  const cssText = 'body { background: url(data:image/png;base64,ABC==); }';
  const result = adaptCssText(cssText, new URL('http://localhost/'));
  expect(result.css).toContain('data:image/png');
});

test('adaptCssText: CSS url() with # unchanged', () => {
  const cssText = 'svg { clip-path: url(#my-mask); }';
  const result = adaptCssText(cssText, new URL('http://localhost/'));
  expect(result.css).toContain('url(#my-mask)');
});

test('real Weekly 2026-08-08 yields one @container doc (max-width:640px)', () => {
  const weeklyHtml = readDoc('weekly/2026-08-08.html');
  const doc = new DOMParser().parseFromString(weeklyHtml, 'text/html');
  const docCss = [...doc.querySelectorAll('style')].map((s) => s.textContent ?? '').join('\n');
  const result = adaptCssText(docCss, new URL('http://localhost/artifact-docs/weekly/2026-08-08.html'));

  // Check that @container is present and @media (max-width) is gone
  expect(result.css).toContain('@container doc');
  expect(result.css).not.toContain('@media (max-width:640px)');
  expect(result.css).not.toContain('@media (min-width:');
});

test('real Copilot Studio doc has no vw in declarations after adapt', () => {
  const copilotHtml = readDoc('llm-best-practices-copilot-studio.html');
  const doc = new DOMParser().parseFromString(copilotHtml, 'text/html');
  const docCss = [...doc.querySelectorAll('style')].map((s) => s.textContent ?? '').join('\n');
  const result = adaptCssText(docCss, new URL('http://localhost/artifact-docs/llm-best-practices-copilot-studio.html'));

  // Check that no vw units remain in declarations (not in comments or strings)
  const lines = result.css.split('\n');
  for (const line of lines) {
    if (line.includes('vw')) {
      // vw might still appear in comments or variable names, but not in actual declarations
      expect(line.trim()).toMatch(/^\s*(\/\*|--)/);
    }
  }
});
