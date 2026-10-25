// ABOUTME: Document stripper — remove scripts, handlers, javascript: URLs, and rename main.
// ABOUTME: Strips: <script>, <noscript>, on* attributes, javascript: URLs.

/**
 * Strip unsafe content from a document.
 *
 * Removes:
 * - <script> and <noscript> elements
 * - <link>, <meta>, <title>, <base>, <style> from body
 * - on* attributes (onclick, onerror, etc.) from all elements
 * - javascript: URLs from href/src/action/formaction/data/xlink:href
 */
export function stripDocument(doc: Document): void {
  // Remove script, noscript, and other body-level meta tags
  doc.querySelectorAll('script, noscript, link, meta, title, base, style').forEach((el) => {
    el.remove();
  });

  // Remove on* handlers and javascript: URLs
  doc.body.querySelectorAll('*').forEach((el) => {
    // Remove on* attributes (case-insensitive)
    for (const attr of [...el.attributes]) {
      if (/^on/i.test(attr.name)) {
        el.removeAttribute(attr.name);
      } else if (
        ['href', 'src', 'action', 'formaction', 'data', 'xlink:href'].includes(attr.name)
      ) {
        const val = attr.value.trim();
        if (/^javascript:/i.test(val)) {
          el.removeAttribute(attr.name);
        }
      }
    }
  });

  // Rename main → doc-main
  renameMain(doc.body);
}

/**
 * Rename all <main> elements to <doc-main> custom element.
 * Preserves attributes and content.
 */
export function renameMain(root: ParentNode): void {
  const mains = [...root.querySelectorAll('main')];
  for (const main of mains) {
    const docMain = document.createElement('doc-main');
    for (const attr of main.attributes) {
      docMain.setAttribute(attr.name, attr.value);
    }
    docMain.replaceChildren(...main.childNodes);
    main.replaceWith(docMain);
  }
}
