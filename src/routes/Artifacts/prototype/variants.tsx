// ABOUTME: PROTOTYPE (throwaway) — three structurally different frames for a doc: A today's strip,
// ABOUTME: B a sticky metadata rail with the doc's own outline, C a reader that hands the page to the doc.
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Heading } from './adapter';
import type { ProtoDoc } from './registry';

export interface VariantProps {
  doc: ProtoDoc;
  surface: ReactNode;
  headings: Heading[];
  onJump: (id: string) => void;
}

const backTo = (doc: ProtoDoc) => (doc.kind === 'weekly' ? '/weekly' : doc.kind === 'wiki' ? '/atisha' : '/artifacts');
const backLabel = (doc: ProtoDoc) => (doc.kind === 'weekly' ? 'Weekly archive' : doc.kind === 'wiki' ? 'Atisha' : 'Artifact shelf');

export function VariantA({ doc, surface }: VariantProps) {
  return (
    <section className="section artifact-viewer" data-screen-label={doc.eyebrow}>
      <header className="artifact-strip">
        <span className="section-eye">{doc.eyebrow}</span>
        <h1 className="artifact-strip-title">{doc.title}</h1>
        <span className="artifact-date">{doc.meta}</span>
        {doc.note && <p className="artifact-note">{doc.note}</p>}
        <a className="artifact-open" href={doc.docPath}>
          Open standalone →
        </a>
      </header>
      {surface}
    </section>
  );
}
VariantA.label = 'Strip (today)';

export function VariantB({ doc, surface, headings, onJump }: VariantProps) {
  return (
    <section className="proto-rail-layout" data-screen-label={doc.eyebrow}>
      <aside className="proto-rail">
        <Link className="proto-back" to={backTo(doc)}>
          ← {backLabel(doc)}
        </Link>
        <span className="section-eye">{doc.eyebrow}</span>
        <h1 className="proto-rail-title">{doc.title}</h1>
        <dl className="proto-rail-meta">
          <dt>Record</dt>
          <dd>{doc.meta}</dd>
          {doc.note && (
            <>
              <dt>Note</dt>
              <dd>{doc.note}</dd>
            </>
          )}
        </dl>
        {headings.length > 0 && (
          <nav className="proto-toc" aria-label="On this page">
            <p className="proto-toc-head">On this page</p>
            <ol>
              {headings.map((h) => (
                <li key={h.id} className={h.level === 3 ? 'is-sub' : undefined}>
                  <button type="button" onClick={() => onJump(h.id)}>
                    {h.text}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        )}
        <a className="proto-standalone" href={doc.docPath}>
          Open standalone ↗
        </a>
      </aside>
      <div className="proto-rail-doc">{surface}</div>
    </section>
  );
}
VariantB.label = 'Rail + outline';

export function VariantC({ doc, surface }: VariantProps) {
  return (
    <article className="proto-reader" data-screen-label={doc.eyebrow}>
      <div className="proto-reader-bar">
        <Link to={backTo(doc)}>← {backLabel(doc)}</Link>
        <span className="proto-reader-kind">{doc.eyebrow.replace('// ', '')}</span>
        <a href={doc.docPath}>Standalone ↗</a>
      </div>
      <h1 className="visually-hidden">{doc.title}</h1>
      <div className="proto-reader-doc">{surface}</div>
      <footer className="proto-colophon">
        <p className="section-eye">About this doc</p>
        <p>
          <strong>{doc.title}</strong> · {doc.meta}
        </p>
        {doc.note && <p>{doc.note}</p>}
        <p>
          The doc keeps its own design. Source: <code>{doc.docPath}</code>
        </p>
      </footer>
    </article>
  );
}
VariantC.label = 'Reader (doc owns the page)';
