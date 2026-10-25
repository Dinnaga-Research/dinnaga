// ABOUTME: Shadow-DOM doc viewer — mounts static HTML docs in open shadow roots with
// ABOUTME: adapted CSS (selectors, media, fonts). React renders an empty host div with no JSX children.
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { adaptDoc, type AdaptOptions } from '../lib/docViewer/adapter';
import { classifyLink } from '../lib/docViewer/links';
import { devWarn } from '../lib/docViewer/devWarn';

interface DocViewerProps {
  docPath: string;
  toRoute?: AdaptOptions['toRoute'];
}

export function DocViewer({ docPath, toRoute }: DocViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mount doc and set up listeners (UNIT-003)
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

        // Set up sticky nav padding (UNIT-003)
        document.documentElement.style.scrollPaddingTop = 'var(--dn-nav-h)';

        // Set up delegated click listener (UNIT-003)
        const handleClick = (e: Event) => {
          const event = e as MouseEvent;
          const link = (event.composedPath()[0] as Element)?.closest('a');
          if (!link) return;

          const href = link.getAttribute('href');
          if (!href) return;

          try {
            const linkUrl = new URL(href, docUrl);
            const classification = classifyLink(
              linkUrl,
              {
                target: link.getAttribute('target'),
                download: link.hasAttribute('download'),
                button: event.button,
                modifiers: event.ctrlKey || event.metaKey || event.shiftKey || event.altKey,
              },
              docUrl,
            );

            if (classification === 'anchor') {
              event.preventDefault();
              const id = linkUrl.hash.slice(1);
              applyAnchorBehavior(root, id, docUrl);
              navigate({ hash: '#' + id });
            } else if (classification === 'spa') {
              event.preventDefault();
              navigate(linkUrl.pathname + linkUrl.search + linkUrl.hash);
              window.scrollTo({ top: 0, behavior: 'instant' });
            }
            // 'browser' links are not prevented, allow default behavior
          } catch {
            // URL parsing failed, allow default behavior
          }
        };

        root.addEventListener('click', handleClick as EventListener);

        setIsLoading(false);

        // Apply hash on initial mount
        if (location.hash) {
          const id = location.hash.slice(1);
          applyAnchorBehavior(root, id, docUrl);
        }

        return () => {
          root.removeEventListener('click', handleClick as EventListener);
        };
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
  }, [docPath, toRoute, navigate, location.hash]);

  // Clean up sticky nav padding on unmount
  useEffect(() => {
    return () => {
      document.documentElement.style.scrollPaddingTop = '';
    };
  }, []);

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
 * Apply anchor behavior: scroll to element, set data-doc-target, focus.
 * Used for both initial load and click navigation (UNIT-003).
 */
function applyAnchorBehavior(
  shadowRoot: ShadowRoot,
  id: string,
  docUrl: URL,
): void {
  const decodedId = decodeURIComponent(id);
  const target = shadowRoot.getElementById(decodedId);

  if (!target) {
    devWarn(`Anchor target not found: #${decodedId} in ${docUrl.pathname}`);
    return;
  }

  // Remove data-doc-target from previous target
  const prev = shadowRoot.querySelector('[data-doc-target]');
  if (prev) {
    prev.removeAttribute('data-doc-target');
  }

  // Set data-doc-target on new target
  target.setAttribute('data-doc-target', '');

  // Ensure target is focusable
  if (!target.hasAttribute('tabindex')) {
    target.setAttribute('tabindex', '-1');
  }

  // Scroll into view (respects scroll-padding-top)
  target.scrollIntoView({ block: 'start' });

  // Focus the target
  target.focus({ preventScroll: true });
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
