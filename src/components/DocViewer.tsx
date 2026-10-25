// ABOUTME: Shadow-DOM doc viewer — mounts static HTML docs in open shadow roots with
// ABOUTME: adapted CSS (selectors, media, fonts). React renders an empty host div with no JSX children.
import { useEffect, useRef, useState } from 'react';
import { adaptDoc, type AdaptOptions } from '../lib/docViewer/adapter';

interface DocViewerProps {
  docPath: string;
  toRoute?: AdaptOptions['toRoute'];
}

export function DocViewer({ docPath, toRoute }: DocViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ctl = new AbortController();
    let mounted = true;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Convert docPath to absolute URL
        const docUrl = new URL(docPath, window.location.href);

        const adapted = await adaptDoc(docUrl, {
          docUrl,
          signal: ctl.signal,
          toRoute,
        });

        if (!mounted) return;

        // Get or create shadow root
        const host = hostRef.current;
        if (!host) return;

        let root = host.shadowRoot;
        if (!root) {
          root = host.attachShadow({ mode: 'open' });
        }

        // Check if adoptedStyleSheets is supported
        const supportsAdopted =
          'adoptedStyleSheets' in ShadowRoot.prototype &&
          'replaceSync' in CSSStyleSheet.prototype;

        // Mount the adapted content, then attach the stylesheet
        root.replaceChildren(adapted.content);
        if (supportsAdopted) {
          root.adoptedStyleSheets = [adapted.sheet];
        } else {
          // Fallback (jsdom has no adoptedStyleSheets): a <style> with the rewritten CSS
          const styleEl = document.createElement('style');
          styleEl.textContent = serializeSheet(adapted.sheet);
          root.prepend(styleEl);
        }

        // Dev logging for container queries (UNIT-002)
        if (import.meta.env.DEV) {
          const containerRules = Array.from(adapted.sheet.cssRules).filter(
            (r) => r.cssText.includes('@container'),
          );
          if (containerRules.length > 0) {
            console.log(`[DocViewer] Found ${containerRules.length} @container rules`);
          }
        }

        setIsLoading(false);
      } catch (err) {
        if (ctl.signal.aborted) return;
        if (!mounted) return;

        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
      ctl.abort();
    };
  }, [docPath, toRoute]);

  if (error) {
    return (
      <>
        <p>This doc didn't load.</p>
        <a href={docPath}>Open standalone</a>
      </>
    );
  }

  return (
    <div
      ref={hostRef}
      className="doc-host"
      data-doc-host=""
      aria-busy={isLoading}
    />
  );
}

/**
 * Serialize a CSSStyleSheet to CSS text.
 * Used as fallback for jsdom which doesn't support adoptedStyleSheets.
 */
function serializeSheet(sheet: CSSStyleSheet): string {
  let css = '';
  for (let i = 0; i < sheet.cssRules.length; i++) {
    css += sheet.cssRules[i]!.cssText + '\n';
  }
  return css;
}
