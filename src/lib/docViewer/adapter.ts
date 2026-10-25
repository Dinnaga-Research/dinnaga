// ABOUTME: Doc adapter — fetch, parse, rewrite CSS and HTML, extract body.
// ABOUTME: Core recipe: fetch → parse → strip → rewrite CSS → extract body → adopt sheet.

import { rewriteSelector } from './selectors';
import { rewriteColorSchemeMedia, isWidthOnlyMedia } from './media';
import { stripDocument } from './strip';
import { isSpaShell } from './shell';
import { devWarn } from './devWarn';

/**
 * Options for adaptDoc
 */
export interface AdaptOptions {
  docUrl: URL;
  signal?: AbortSignal;
  toRoute?: (slug: string, hash: string) => string;
}

/**
 * Result of adaptCssText
 */
export interface AdaptedCss {
  css: string;
  fontFaces: string[];
}

/**
 * Result of adaptDoc
 */
export interface AdaptedDoc {
  content: DocumentFragment | Element;
  sheet: CSSStyleSheet;
  family: string | null;
  isQuartz: boolean;
  lang?: string;
  bodyAttrs: Record<string, string>;
  hostAttrs: Record<string, string>;
}

/**
 * Adapt CSS text: rewrite vw→cqi, @media→@container, extract @font-face, absolutize URLs.
 *
 * Returns both the transformed CSS text and extracted font-faces.
 * Used by both jsdom (string-based) and browser (CSSStyleSheet-based) paths.
 */
export function adaptCssText(cssText: string, sheetUrl: URL): AdaptedCss {
  let css = dropImports(cssText);
  const fontFaces: string[] = [];

  // 1. Extract and absolutize @font-face rules
  // We need to handle @font-face rules carefully since they can have url() in src
  const fontFaceMatches = extractFontFaces(css);
  for (const fontFaceText of fontFaceMatches) {
    // Absolutize URLs within the @font-face
    const absolutized = absolutizeUrlsInCss(fontFaceText, sheetUrl);
    fontFaces.push(absolutized);
  }
  // Remove @font-face rules from main CSS
  css = removeFontFaces(css);

  // 2. Rewrite vw to cqi in declarations
  css = rewriteVwToCqi(css);

  // 3. Convert width-only @media to @container
  css = convertWidthMediaToContainer(css);

  // 4. Absolutize URL values in CSS (excluding @font-face which we already handled)
  css = absolutizeUrlsInCss(css, sheetUrl);

  return { css, fontFaces };
}

/**
 * Extract @font-face rules from CSS text.
 * Handles @font-face rules that may have url() in src declarations.
 */
function extractFontFaces(css: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let start = -1;

  for (let i = 0; i < css.length; i++) {
    // Look for @font-face
    if (
      i + 10 <= css.length &&
      css.substring(i, i + 10).toLowerCase() === '@font-face'
    ) {
      // Find the opening brace
      let j = i + 10;
      while (j < css.length && css[j] !== '{') {
        j++;
      }
      if (j < css.length) {
        start = i;
        depth = 0;
        i = j; // move to the {
      }
    }

    // Track brace depth
    if (start >= 0) {
      if (css[i] === '{') {
        depth++;
      } else if (css[i] === '}') {
        depth--;
        if (depth === 0) {
          // Found the closing brace
          result.push(css.substring(start, i + 1));
          start = -1;
        }
      }
    }
  }

  return result;
}

/**
 * Remove all @font-face rules from CSS text.
 */
function removeFontFaces(css: string): string {
  const fontFaceRules = extractFontFaces(css);
  let result = css;
  for (const rule of fontFaceRules) {
    result = result.replace(rule, '');
  }
  return result;
}

/**
 * Rewrite viewport width (vw) units to container query units (cqi).
 * Only rewrite in declarations (not in comments or variable names).
 * Keep !important intact.
 */
function rewriteVwToCqi(css: string): string {
  // Match declarations: property: value; or property: value !important;
  // We need to be careful to only rewrite in values, not in selectors or comments
  return css.replace(/(\d)vw\b/g, '$1cqi');
}

/**
 * Convert width-only @media queries to @container queries.
 * Only converts queries that are ONLY (min-width: ...) and/or (max-width: ...) with 'and'.
 * Uses brace counting to properly parse nested rules.
 */
function convertWidthMediaToContainer(css: string): string {
  let result = '';
  let i = 0;

  while (i < css.length) {
    // Look for @media
    if (
      i + 6 <= css.length &&
      css.substring(i, i + 6).toLowerCase() === '@media'
    ) {
      // Find the opening brace and extract the query
      const queryStart = i + 6;
      let braceStart = -1;

      for (let j = queryStart; j < css.length; j++) {
        if (css[j] === '{') {
          braceStart = j;
          break;
        }
      }

      if (braceStart === -1) {
        // No opening brace found, skip
        result += css[i];
        i++;
        continue;
      }

      const query = css.substring(queryStart, braceStart).trim();

      // Count braces to find the matching closing brace
      let depth = 0;
      let braceEnd = -1;
      for (let j = braceStart; j < css.length; j++) {
        if (css[j] === '{') {
          depth++;
        } else if (css[j] === '}') {
          depth--;
          if (depth === 0) {
            braceEnd = j;
            break;
          }
        }
      }

      if (braceEnd === -1) {
        // No matching brace, skip
        result += css[i];
        i++;
        continue;
      }

      // Extract the inner content
      const innerContent = css.substring(braceStart + 1, braceEnd);

      // Check if query is width-only
      if (isWidthOnlyMedia(query)) {
        // Replace with @container
        result += `@container doc ${query} {${innerContent}}`;
      } else {
        // Keep as-is
        result += css.substring(i, braceEnd + 1);
      }

      i = braceEnd + 1;
    } else {
      result += css[i];
      i++;
    }
  }

  return result;
}

/**
 * Absolutize URL values in CSS url() and src: url() declarations.
 * Skip data: URLs, # references, and already absolute URLs.
 */
function absolutizeUrlsInCss(css: string, sheetUrl: URL): string {
  // Match url(...) patterns
  return css.replace(/url\s*\(\s*['"]?([^'")]+)['"]?\s*\)/gi, (match, urlValue) => {
    const trimmed = urlValue.trim();

    // Skip data: URLs, # references, and absolute URLs with schemes
    if (trimmed.startsWith('data:') || trimmed.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
      return match;
    }

    // Absolutize relative URL against sheet URL
    try {
      const absolute = new URL(trimmed, sheetUrl).href;
      return `url("${absolute}")`;
    } catch {
      // If URL parsing fails, return original
      return match;
    }
  });
}

/**
 * Drop `@import` rules (constructed sheets ignore them) and warn once per rule.
 */
function dropImports(css: string): string {
  return css.replace(/@import\b[^;]*;?/gi, (rule) => {
    devWarn(`@import dropped (constructed sheets ignore it): ${rule.trim()}`);
    return '';
  });
}

/**
 * Count `position: fixed` and vh/svh/lvh/dvh declarations (not rewritten) and warn.
 */
export function warnViewportDependent(css: string): { fixed: number; vh: number } {
  const fixed = (css.match(/position\s*:\s*fixed/gi) ?? []).length;
  const vh = (css.match(/\d[sld]?vh\b/gi) ?? []).length;
  if (fixed > 0 || vh > 0) {
    devWarn(`Viewport-dependent CSS left unchanged: ${fixed} position:fixed, ${vh} vh-family declarations`);
  }
  return { fixed, vh };
}

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

function absolutizeValue(value: string, base: URL): string {
  const v = value.trim();
  if (v === '' || v.startsWith('#') || SCHEME.test(v)) return value;
  try {
    return new URL(v, base).href;
  } catch {
    return value;
  }
}

/** Absolutize each candidate of a `srcset` value individually. */
export function absolutizeSrcset(srcset: string, base: URL): string {
  const out: string[] = [];
  let i = 0;
  const n = srcset.length;
  while (i < n) {
    while (i < n && /[\s,]/.test(srcset[i]!)) i++;
    if (i >= n) break;
    let start = i;
    while (i < n && !/\s/.test(srcset[i]!)) i++;
    let url = srcset.slice(start, i);
    let descriptor = '';
    if (url.endsWith(',')) {
      url = url.replace(/,+$/, '');
    } else {
      while (i < n && /\s/.test(srcset[i]!)) i++;
      start = i;
      let depth = 0;
      while (i < n && !(srcset[i] === ',' && depth === 0)) {
        if (srcset[i] === '(') depth++;
        else if (srcset[i] === ')') depth--;
        i++;
      }
      descriptor = srcset.slice(start, i).trim();
    }
    out.push(`${absolutizeValue(url, base)}${descriptor ? ' ' + descriptor : ''}`);
  }
  return out.join(', ');
}

const URL_ATTRS = ['href', 'src', 'poster', 'data', 'action'];

/**
 * Make `href`, `src`, `poster`, `data`, `action` and `srcset` absolute against `base`.
 * Values starting with `#` or already carrying a scheme are left alone.
 */
export function absolutizeMarkup(root: ParentNode, base: URL): void {
  const sel = [...URL_ATTRS, 'srcset'].map((a) => `[${a}]`).join(',');
  for (const el of root.querySelectorAll(sel)) {
    for (const attr of URL_ATTRS) {
      const v = el.getAttribute(attr);
      if (v !== null) {
        const next = absolutizeValue(v, base);
        if (next !== v) el.setAttribute(attr, next);
      }
    }
    const ss = el.getAttribute('srcset');
    if (ss !== null) el.setAttribute('srcset', absolutizeSrcset(ss, base));
  }
}

/** The doc's `<base href>` resolved against the doc URL, or else the doc URL. */
export function docBaseUrl(doc: Document, docUrl: URL): URL {
  const href = doc.querySelector('base[href]')?.getAttribute('href');
  if (href) {
    try {
      return new URL(href, docUrl);
    } catch {
      /* fall through */
    }
  }
  return docUrl;
}

export interface SheetSource {
  css: string;
  url: URL;
}

/**
 * Collect `<style>` elements and `<link rel~="stylesheet">` in document order. Links are
 * fetched (same abort signal) and keep their position. A failed link is skipped with a
 * dev warning. A `media` attribute wraps the text in `@media <value> { ... }`.
 */
export async function collectSheets(
  doc: Document,
  base: URL,
  signal?: AbortSignal,
): Promise<SheetSource[]> {
  const nodes = [...doc.querySelectorAll('style, link')].filter(
    (el) =>
      el.localName === 'style' ||
      (el.getAttribute('rel') ?? '').toLowerCase().split(/\s+/).includes('stylesheet'),
  );
  const out = await Promise.all(
    nodes.map(async (el): Promise<SheetSource | null> => {
      const media = el.getAttribute('media')?.trim();
      const wrap = (css: string) => (media ? `@media ${media} {\n${css}\n}` : css);
      if (el.localName === 'style') {
        return { css: wrap(el.textContent ?? ''), url: base };
      }
      const href = el.getAttribute('href');
      if (!href) return null;
      let url: URL;
      try {
        url = new URL(href, base);
      } catch {
        devWarn(`Stylesheet skipped (bad href): ${href}`);
        return null;
      }
      try {
        const res = await fetch(url, { signal });
        if (!res.ok) {
          devWarn(`Stylesheet skipped (status ${res.status}): ${url.href}`);
          return null;
        }
        return { css: wrap(await res.text()), url };
      } catch (err) {
        if (signal?.aborted) throw err;
        devWarn(`Stylesheet skipped (${err instanceof Error ? err.message : 'fetch failed'}): ${url.href}`);
        return null;
      }
    }),
  );
  return out.filter((x): x is SheetSource => x !== null);
}

let hoistedFonts: CSSStyleSheet | null = null;
const hoistedFontText = new Set<string>();

/** The one module-level sheet holding every Doc's hoisted `@font-face` rules. */
export function getHoistedFontSheet(): CSSStyleSheet | null {
  return hoistedFonts;
}

/**
 * Add `@font-face` rules to one module-level constructed sheet, appended once to
 * `document.adoptedStyleSheets`. De-duplicated by text.
 */
export function hoistFontFaces(fontFaces: string[]): void {
  if (fontFaces.length === 0) return;
  if (!hoistedFonts) {
    hoistedFonts = new CSSStyleSheet();
  }
  for (const text of fontFaces) {
    if (hoistedFontText.has(text)) continue;
    hoistedFontText.add(text);
    try {
      hoistedFonts.insertRule(text, hoistedFonts.cssRules.length);
    } catch (err) {
      devWarn('Could not hoist @font-face rule', err);
    }
  }
  const adopted = (document as Document & { adoptedStyleSheets?: CSSStyleSheet[] }).adoptedStyleSheets;
  if (adopted && !adopted.includes(hoistedFonts)) {
    document.adoptedStyleSheets = [...adopted, hoistedFonts];
  }
}

/**
 * Adapt a document for shadow-DOM mounting.
 *
 * 1. Fetch the doc
 * 2. Parse as HTML
 * 3. Detect SPA shell / missing doc
 * 4. Strip scripts, handlers, javascript: URLs
 * 5. Rewrite CSS (selectors and media queries)
 * 6. Extract body content into doc-body element
 * 7. Create adopted stylesheet
 * 8. Return DocumentFragment with adapted content
 */
export async function adaptDoc(docPath: URL, opts: AdaptOptions): Promise<AdaptedDoc> {
  // Fetch the document
  const res = await fetch(docPath, { signal: opts.signal });

  if (!res.ok) {
    throw new Error(`Doc fetch failed: status ${res.status}`);
  }

  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, 'text/html');

  // Detect SPA shell
  if (isSpaShell(doc)) {
    throw new Error('Doc appears to be the SPA shell, not a real document');
  }

  // Detect if it's a Quartz doc
  const isQuartz = doc.getElementById('quartz-root') !== null;

  // Strip unsafe content
  stripDocument(doc);

  // Collect <style> and <link rel=stylesheet> in document order, then apply the UNIT-002
  // transforms (vw -> cqi, width @media -> @container, @font-face hoisting, url() absolutising)
  // as string work per source sheet. Never rebuild a rule from rule.style.cssText: shorthands
  // containing var() serialise as empty strings and would delete e.g. the Copilot `.principle` border.
  const base = docBaseUrl(doc, opts.docUrl);
  const sources = await collectSheets(doc, base, opts.signal);
  const cssParts: string[] = [];
  const fontFaces: string[] = [];
  for (const src of sources) {
    const adaptedCss = adaptCssText(src.css, src.url);
    cssParts.push(adaptedCss.css);
    fontFaces.push(...adaptedCss.fontFaces);
  }
  const docCss = cssParts.join('\n');
  hoistFontFaces(fontFaces);
  warnViewportDependent(docCss);

  // Markup URLs resolve against the doc, not the site route
  absolutizeMarkup(doc.body, base);

  // Build sheet from adapted CSS
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(docCss);

  // Rewrite rule preludes (selectors, color-scheme media) IN PLACE
  rewriteRulesInPlace(sheet.cssRules);

  // Reset goes first, guard goes last, so a doc's own root rules can style the host
  // but cannot clip it or fix its size.
  // Include container: doc / inline-size for container query support
  sheet.insertRule('doc-body,doc-main{display:block}', 0);
  sheet.insertRule(':host{all:initial;display:block;container:doc/inline-size}', 0);
  sheet.insertRule(
    ':host{overflow-x:auto!important;height:auto!important;max-height:none!important;position:relative!important}',
    sheet.cssRules.length,
  );

  // Extract body attributes
  const bodyAttrs: Record<string, string> = {};
  for (const attr of doc.body.attributes) {
    bodyAttrs[attr.name] = attr.value;
  }

  // Prepare host attributes
  const hostAttrs: Record<string, string> = {
    'data-doc-host': '',
  };

  // Get language
  const lang = doc.documentElement.lang || 'en';

  // Create a doc-body element with body children
  const docBody = document.createElement('doc-body');
  for (const [name, value] of Object.entries(bodyAttrs)) {
    docBody.setAttribute(name, value);
  }
  if (lang) {
    docBody.setAttribute('lang', lang);
  }

  // Import body children into the new element
  for (const child of [...doc.body.childNodes]) {
    docBody.appendChild(document.importNode(child, true));
  }

  // Create content fragment
  const frag = document.createDocumentFragment();
  frag.appendChild(docBody);

  return {
    content: frag,
    sheet,
    family: null, // Will be extended by UNIT-007
    isQuartz,
    lang,
    bodyAttrs,
    hostAttrs,
  };
}

/**
 * Rewrite rule preludes (selectors, color-scheme media) in place, recursing into
 * grouping rules (@media, @supports, nested rules).
 */
function rewriteRulesInPlace(rules: CSSRuleList): void {
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSStyleRule) {
      rule.selectorText = rewriteSelector(rule.selectorText);
    } else if (rule instanceof CSSMediaRule) {
      const text = rule.media.mediaText;
      const next = rewriteColorSchemeMedia(text);
      if (next !== null) {
        rule.media.mediaText = next;
      } else if (text.includes('prefers-color-scheme')) {
        devWarn(`Compound color-scheme query left unchanged: ${text}`);
      }
    }
    const nested = (rule as { cssRules?: CSSRuleList }).cssRules;
    if (nested) rewriteRulesInPlace(nested);
  }
}
