// ABOUTME: The doc reader frame (Darkroom §7.7): a sticky Doc bar under the site nav, the shadow-DOM
// ABOUTME: viewer edge to edge, and an "About this doc" colophon in the two-column grid after it.
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DocViewer } from './DocViewer';
import { TestedLine } from './TestedMark';
import './DocFrame.css';

interface DocFrameProps {
  backHref: string;
  backLabel: string;
  kind: string;
  colophonTitle: string;
  dateLine: string;
  note?: string;
  // What an Atisha doc was checked against; rendered as a TestedLine under the title.
  tested?: string;
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
  tested,
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
        <span className="doc-bar-kind dn-label">{kind}</span>
        <a className="doc-bar-open" href={docPath}>
          Open standalone
        </a>
      </nav>
      <DocViewer docPath={docPath} toRoute={toRoute} key={docPath} />
      <footer className="doc-colophon">
        <div className="dn-page dn-grid">
          <h2 className="doc-colophon-head dn-grid__label">About this doc</h2>
          <div className="doc-colophon-body dn-grid__body">
            <p className="doc-colophon-title">{colophonTitle}</p>
            <p className="doc-colophon-line">{dateLine}</p>
            {tested && <TestedLine>{tested}</TestedLine>}
            {note && <p className="doc-colophon-line doc-colophon-note">{note}</p>}
          </div>
        </div>
      </footer>
    </article>
  );
}
