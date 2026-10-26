// ABOUTME: Tests for the doc adapter — fetch, parse, adapt CSS and HTML.
// ABOUTME: Covers: fetch real docs, CSS rewriting, stripping, SPA shell detection.
import { expect, test, vi } from 'vitest';
import {
  adaptDoc,
  adaptCssText,
  absolutizeMarkup,
  collectSheets,
  docBaseUrl,
  getHoistedFontSheet,
} from './adapter';
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

test('real Weekly 2026-08-08 yields one @container doc (max-width:640px) rule and no width @media', async () => {
  stubDoc(readDoc('weekly/2026-08-08.html'));
  const u = new URL('http://localhost:4242/artifact-docs/weekly/2026-08-08.html');
  const { sheet } = await adaptDoc(u, { docUrl: u });
  const rules = [...sheet.cssRules].map((r) => r.cssText);
  const containers = rules.filter((t) => /^@container doc \(max-width:\s*640px\)/.test(t));
  expect(containers).toHaveLength(1);
  expect(containers[0]).toContain('.grid2');
  const widthMedia = [...sheet.cssRules].filter(
    (r) => r instanceof CSSMediaRule && /(min|max)-width/.test(r.media.mediaText),
  );
  expect(widthMedia).toHaveLength(0);
});

test('real Copilot Studio sheet has no vw in any declaration', async () => {
  stubDoc(readDoc('llm-best-practices-copilot-studio.html'));
  const u = new URL('http://localhost:4242/artifact-docs/llm-best-practices-copilot-studio.html');
  const { sheet } = await adaptDoc(u, { docUrl: u });
  const text = [...sheet.cssRules].map((r) => r.cssText).join('\n');
  expect(text).not.toMatch(/\dvw\b/);
  // the raw adapter output agrees
  const raw = [...new DOMParser().parseFromString(readDoc('llm-best-practices-copilot-studio.html'), 'text/html').querySelectorAll('style')]
    .map((x) => x.textContent ?? '')
    .join('\n');
  expect(raw).toMatch(/\dvw\b/);
  const adapted = adaptCssText(raw, u).css;
  expect(adapted).not.toMatch(/\dvw\b/);
  expect(adapted).toMatch(/3\.4cqi/); // jsdom's CSSOM drops cqi values, so check the text
});

test('adaptCssText: width media with a media type or other feature is left alone', () => {
  const u = new URL('http://localhost/');
  for (const q of ['screen and (max-width:640px)', 'print', '(prefers-color-scheme: dark)']) {
    const out = adaptCssText(`@media ${q} { p { color: red; } }`, u).css;
    expect(out).toContain('@media');
    expect(out).not.toContain('@container');
  }
});

test('adaptCssText: @import is dropped', () => {
  const out = adaptCssText('@import url(other.css);\np{color:red}', new URL('http://localhost/'));
  expect(out.css).not.toContain('@import');
  expect(out.css).toContain('p{color:red}');
});

test('adaptCssText: CSS url(img/x.png) from a linked sheet at /a/b/site.css resolves on the site origin', () => {
  const out = adaptCssText('p{background:url(img/x.png)}', new URL('http://localhost:4242/a/b/site.css'));
  expect(out.css).toContain('http://localhost:4242/a/b/img/x.png');
});

test('@font-face: two docs declaring the identical rule produce one hoisted rule', async () => {
  const html =
    '<html><head><style>@font-face{font-family:"Dup";src:url(fonts/dup.woff2)}p{color:red}</style></head><body><p>t</p></body></html>';
  stubDoc(html);
  const u1 = new URL('http://localhost:4242/artifact-docs/a/one.html');
  const first = await adaptDoc(u1, { docUrl: u1 });
  await adaptDoc(u1, { docUrl: u1 });
  stubDoc(html);
  await adaptDoc(u1, { docUrl: u1 });

  // removed from the doc sheet
  expect([...first.sheet.cssRules].some((r) => r instanceof CSSFontFaceRule)).toBe(false);
  const hoisted = getHoistedFontSheet();
  expect(hoisted).toBeTruthy();
  const faces = [...hoisted!.cssRules].filter((r) => r.cssText.includes('"Dup"'));
  expect(faces).toHaveLength(1);
  // jsdom's CSSOM drops `src`, so check the absolutised text from the string stage
  expect(adaptCssText(html.match(/<style>(.*)<\/style>/)![1]!, u1).fontFaces[0]).toContain(
    'http://localhost:4242/artifact-docs/a/fonts/dup.woff2',
  );
  // (jsdom has no document.adoptedStyleSheets; the append-once check lives in the e2e spec)
});

test('markup URLs are absolutised against <base href>, including srcset; #, mailto:, https:// stay', () => {
  const doc = new DOMParser().parseFromString(
    '<html><head><base href="../shared/"></head><body>' +
      '<img src="a.png" srcset="a.png 1x, b.png 2x">' +
      '<a href="#c07">x</a><a href="mailto:a@b.co">m</a><a href="https://example.com/p">e</a>' +
      '<form action="go"></form><video poster="p.jpg"></video><object data="d.svg"></object></body></html>',
    'text/html',
  );
  const docUrl = new URL('http://localhost:4242/artifact-docs/sub/doc.html');
  const base = docBaseUrl(doc, docUrl);
  expect(base.href).toBe('http://localhost:4242/artifact-docs/shared/');
  absolutizeMarkup(doc.body, base);
  const q = (sel: string) => doc.querySelector(sel)!;
  expect(q('img').getAttribute('src')).toBe('http://localhost:4242/artifact-docs/shared/a.png');
  expect(q('img').getAttribute('srcset')).toBe(
    'http://localhost:4242/artifact-docs/shared/a.png 1x, http://localhost:4242/artifact-docs/shared/b.png 2x',
  );
  expect(q('a[href^="#"]').getAttribute('href')).toBe('#c07');
  expect(q('a[href^="mailto"]').getAttribute('href')).toBe('mailto:a@b.co');
  expect(q('a[href^="https"]').getAttribute('href')).toBe('https://example.com/p');
  expect(q('form').getAttribute('action')).toBe('http://localhost:4242/artifact-docs/shared/go');
  expect(q('video').getAttribute('poster')).toBe('http://localhost:4242/artifact-docs/shared/p.jpg');
  expect(q('object').getAttribute('data')).toBe('http://localhost:4242/artifact-docs/shared/d.svg');
});

test('without <base>, markup resolves against the doc URL', () => {
  const doc = new DOMParser().parseFromString('<html><body><img src="x.png"></body></html>', 'text/html');
  const docUrl = new URL('http://localhost:4242/artifact-docs/sub/doc.html');
  absolutizeMarkup(doc.body, docBaseUrl(doc, docUrl));
  expect(doc.querySelector('img')!.getAttribute('src')).toBe('http://localhost:4242/artifact-docs/sub/x.png');
});

test('link order: <style>, <link>, <style> keep document order; media wraps; a 404 link is skipped with a warning', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  global.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const href = String(input);
    if (href.endsWith('/ok.css')) return { ok: true, status: 200, text: async () => '.b{color:blue}' } as Response;
    if (href.endsWith('/print.css')) return { ok: true, status: 200, text: async () => '.p{color:black}' } as Response;
    return { ok: false, status: 404, text: async () => 'nope' } as Response;
  }) as typeof fetch;
  const doc = new DOMParser().parseFromString(
    '<html><head><style>.a{color:red}</style><link rel="stylesheet" href="ok.css">' +
      '<link rel="stylesheet" href="missing.css"><link rel="stylesheet alternate" href="print.css" media="print">' +
      '<link rel="icon" href="x.ico"><style>.c{color:green}</style></head><body></body></html>',
    'text/html',
  );
  const base = new URL('http://localhost:4242/artifact-docs/d.html');
  const sheets = await collectSheets(doc, base);
  expect(sheets.map((x) => x.css.replace(/\s+/g, ''))).toEqual([
    '.a{color:red}',
    '.b{color:blue}',
    '@mediaprint{.p{color:black}}',
    '.c{color:green}',
  ]);
  expect(sheets[1]!.url.href).toBe('http://localhost:4242/artifact-docs/ok.css');
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('missing.css'));
  warn.mockRestore();
});

test('a 404 linked sheet does not fail the mount', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  global.fetch = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input).endsWith('.html'))
      return {
        ok: true,
        status: 200,
        text: async () =>
          '<html><head><link rel="stylesheet" href="gone.css"><style>p{color:red}</style></head><body><p>t</p></body></html>',
      } as Response;
    return { ok: false, status: 404, text: async () => '' } as Response;
  }) as typeof fetch;
  const u = new URL('http://localhost:4242/artifact-docs/x.html');
  const { sheet } = await adaptDoc(u, { docUrl: u });
  expect([...sheet.cssRules].map((r) => r.cssText).join('')).toContain('color: red');
  warn.mockRestore();
});

test('adaptDoc absolutises body markup URLs against the doc', async () => {
  stubDoc('<html><body><img src="x.png"><a href="#top">t</a></body></html>');
  const u = new URL('http://localhost:4242/artifact-docs/sub/x.html');
  const { content } = await adaptDoc(u, { docUrl: u });
  const img = (content as DocumentFragment).querySelector('img')!;
  expect(img.getAttribute('src')).toBe('http://localhost:4242/artifact-docs/sub/x.png');
});
