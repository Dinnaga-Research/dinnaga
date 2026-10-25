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

  // Concatenate the doc's CSS into one sheet, then rewrite rule preludes IN PLACE.
  // Never rebuild a rule from rule.style.cssText: shorthands containing var()
  // serialise as empty strings and would delete e.g. the Copilot `.principle` border.
  const docCss = [...doc.querySelectorAll('style')].map((s) => s.textContent ?? '').join('\n');
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(docCss);
  rewriteRulesInPlace(sheet.cssRules);

  // Reset goes first, guard goes last, so a doc's own root rules can style the host
  // but cannot clip it or fix its size.
  sheet.insertRule('doc-body,doc-main{display:block}', 0);
  sheet.insertRule(':host{all:initial;display:block}', 0);
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
