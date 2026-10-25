// ABOUTME: Doc adapter — fetch, parse, rewrite CSS and HTML, extract body.
// ABOUTME: Core recipe: fetch → parse → strip → rewrite CSS → extract body → adopt sheet.

import { rewriteSelector } from './selectors';
import { rewriteColorSchemeMedia } from './media';
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

  // Gather and rewrite CSS
  const cssText = gatherAndRewriteCSS(doc);
  const sheet = new CSSStyleSheet();

  // Build the final CSS with reset and guard
  const resetCSS =
    ':host{all:initial;display:block}doc-body,doc-main{display:block}';
  const guardCSS =
    ':host{overflow-x:auto!important;height:auto!important;max-height:none!important;position:relative!important}';

  sheet.replaceSync(resetCSS + '\n' + cssText + '\n' + guardCSS);

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
 * Gather CSS from style tags and rewrite selectors and media queries.
 */
function gatherAndRewriteCSS(doc: Document): string {
  const parts: string[] = [];

  for (const style of doc.querySelectorAll('style')) {
    let cssText = style.textContent || '';
    cssText = rewriteCSS(cssText);
    parts.push(cssText);
  }

  return parts.join('\n');
}

/**
 * Rewrite a CSS text block: selectors and media queries.
 */
function rewriteCSS(cssText: string): string {
  // Parse CSS and rewrite rules
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(cssText);
    return rewriteSheetRules(sheet.cssRules);
  } catch {
    // If replaceSync fails, return original (safe fallback)
    return cssText;
  }
}

/**
 * Recursively rewrite a CSSRuleList.
 */
function rewriteSheetRules(rules: CSSRuleList): string {
  let result = '';

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]!;

    if (rule instanceof CSSStyleRule) {
      // Rewrite selector
      const newSelector = rewriteSelector(rule.selectorText);
      result += `${newSelector}{${rule.style.cssText}}\n`;
    } else if (rule instanceof CSSMediaRule) {
      // Rewrite media query
      const newMedia = rewriteColorSchemeMedia(rule.media.mediaText);
      const mediaText = newMedia !== null ? newMedia : rule.media.mediaText;

      if (newMedia === null && rule.media.mediaText.includes('prefers-color-scheme')) {
        devWarn(`Compound color-scheme query left unchanged: ${rule.media.mediaText}`);
      }

      result += `@media ${mediaText}{`;
      result += rewriteSheetRules(rule.cssRules);
      result += '}\n';
    } else if (rule instanceof CSSSupportsRule) {
      // Recurse into @supports
      result += `@supports ${rule.conditionText}{`;
      result += rewriteSheetRules(rule.cssRules);
      result += '}\n';
    } else {
      // Other rules (keyframes, etc.) - keep as-is
      result += rule.cssText + '\n';
    }
  }

  return result;
}
