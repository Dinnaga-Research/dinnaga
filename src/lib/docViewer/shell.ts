// ABOUTME: SPA shell detector — identify the index.html shell vs. real docs.
// ABOUTME: Returns true when document contains #root (the React app root).

/**
 * Check if a document is the SPA shell (index.html) vs. a real static doc.
 * The SPA shell contains a <div id="root"> for React to mount into.
 */
export function isSpaShell(doc: Document): boolean {
  return doc.getElementById('root') !== null;
}
