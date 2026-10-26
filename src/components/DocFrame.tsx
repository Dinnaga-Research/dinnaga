// ABOUTME: The doc reader frame (layout C) — a sticky "Doc" bar under the site nav, the
// ABOUTME: shadow-DOM viewer edge to edge, and an "About this doc" colophon after it.
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DocViewer } from './DocViewer';

interface DocFrameProps {
  backHref: string;
  backLabel: string;
  kind: string;
  colophonTitle: string;
  dateLine: string;
  note?: string;
  docPath: string;
  toRoute?: (slug: string, hash: string) => string;
}

export function DocFrame({
  backHref,
  backLabel,
  kind,
  colophonTitle,
  dateLine,
  note,
  docPath,
  toRoute,
}: DocFrameProps) {
  // Print rules are scoped to viewer routes by this attribute, set while the frame is mounted.
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.docReader = '';
    return () => {
      delete html.dataset.docReader;
    };
  }, []);

  return (
    <article className="doc-reader">
      <nav className="doc-bar" aria-label="Doc">
        <Link className="doc-bar-back" to={backHref}>
          ← {backLabel}
        </Link>
        <span className="doc-bar-kind">{kind}</span>
        <a className="doc-bar-open" href={docPath}>
          Open standalone
        </a>
      </nav>
      <DocViewer docPath={docPath} toRoute={toRoute} key={docPath} />
      <footer className="doc-colophon">
        <h2 className="doc-colophon-head">About this doc</h2>
        <p className="doc-colophon-line">
          <strong>{colophonTitle}</strong>
        </p>
        <p className="doc-colophon-line">{dateLine}</p>
        {note && <p className="doc-colophon-line doc-colophon-note">{note}</p>}
      </footer>
    </article>
  );
}
