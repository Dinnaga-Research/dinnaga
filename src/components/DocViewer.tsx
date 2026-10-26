// ABOUTME: Shadow-DOM doc viewer — mounts static HTML docs in open shadow roots with
// ABOUTME: adapted CSS (selectors, media, fonts). React renders an empty host div with no JSX children.
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { adaptDoc, type AdaptOptions } from '../lib/docViewer/adapter';
import { classifyLink } from '../lib/docViewer/links';
import { devWarn } from '../lib/docViewer/devWarn';
import { bindPrintTheme } from '../lib/docViewer/quartz';

interface DocViewerProps {
  docPath: string;
  toRoute?: AdaptOptions['toRoute'];
}

export function DocViewer({ docPath, toRoute }: DocViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const navigateRef = useRef(navigate);
  const [isQuartz, setIsQuartz] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [root, setRoot] = useState<ShadowRoot | null>(null);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  // Mount the doc. Runs once per docPath (the parent keys this component by docPath);
  // hash changes never remount.
  useEffect(() => {
    const ctl = new AbortController();
    let mounted = true;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const docUrl = new URL(docPath, window.location.href);
        const adapted = await adaptDoc(docUrl, { docUrl, signal: ctl.signal, toRoute });
        if (!mounted) return;

        const host = hostRef.current;
        if (!host) return;

        const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
        for (const [name, value] of Object.entries(adapted.hostAttrs)) {
          if (name !== 'data-doc-host') host.setAttribute(name, value);
        }
        setIsQuartz(adapted.isQuartz);

        // Check if adoptedStyleSheets is supported
        const supportsAdopted =
          'adoptedStyleSheets' in ShadowRoot.prototype &&
          'replaceSync' in CSSStyleSheet.prototype;

        // Mount the adapted content, then attach the stylesheet
        shadow.replaceChildren(adapted.content);
        if (supportsAdopted) {
          shadow.adoptedStyleSheets = [adapted.sheet];
        } else {
          // Fallback (jsdom has no adoptedStyleSheets): a <style> with the rewritten CSS
          const styleEl = document.createElement('style');
          styleEl.textContent = serializeSheet(adapted.sheet);
          shadow.prepend(styleEl);
        }

        setRoot(shadow);
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
      setRoot(null);
      setIsQuartz(false);
    };
  }, [docPath, toRoute]);

  // Sticky nav offset: while a doc is mounted, anchors clear the site nav and the Doc bar.
  useEffect(() => {
    if (!root) return;
    const html = document.documentElement;
    html.style.scrollPaddingTop = 'calc(var(--dn-nav-h) + var(--doc-bar-h))';
    // The browser's own scroll restoration would fight the hash effect on Back/Forward
    // (it restores a smooth-scroll mid-point). The hash effect owns the position instead.
    const prevRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      html.style.scrollPaddingTop = '';
      window.history.scrollRestoration = prevRestoration;
    };
  }, [root]);

  // Quartz: dark on screen, light in print. Scripts are stripped, so the host carries the attribute.
  useEffect(() => {
    const host = hostRef.current;
    if (!root || !isQuartz || !host) return;
    return bindPrintTheme(host);
  }, [root, isQuartz]);

  // One delegated click listener on the shadow root.
  useEffect(() => {
    if (!root) return;
    const docUrl = new URL(docPath, window.location.href);

    const handleClick = (e: Event) => {
      const event = e as MouseEvent;
      if (event.defaultPrevented) return;
      const link = event
        .composedPath()
        .find((n): n is Element => n instanceof Element && n.localName === 'a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      let linkUrl: URL;
      try {
        linkUrl = new URL(href, docUrl);
      } catch {
        return;
      }

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
        navigateRef.current({ hash: '#' + id });
      } else if (classification === 'spa') {
        event.preventDefault();
        navigateRef.current(linkUrl.pathname + linkUrl.search + linkUrl.hash);
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      // 'browser': leave the click alone
    };

    root.addEventListener('click', handleClick);
    return () => root.removeEventListener('click', handleClick);
  }, [root, docPath]);

  // Hash on load and on history moves: apply without pushing a new entry.
  useEffect(() => {
    if (!root || !location.hash) return;
    applyAnchorBehavior(root, location.hash.slice(1), new URL(docPath, window.location.href));
  }, [root, location.hash, docPath]);

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
  let decodedId = id;
  try {
    decodedId = decodeURIComponent(id);
  } catch {
    /* malformed escape: use the raw id */
  }
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
