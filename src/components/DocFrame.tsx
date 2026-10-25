// ABOUTME: Shared doc-viewer chrome — compact header strip (eyebrow, title, meta, optional
// ABOUTME: note, standalone link) over the shadow-DOM viewer or full-bleed iframe.
import { DocViewer } from './DocViewer';

interface DocFrameProps {
  eyebrow: string;
  title: string;
  meta: string;
  note?: string;
  docPath: string;
  screenLabel: string;
}

export function DocFrame({ eyebrow, title, meta, note, docPath, screenLabel }: DocFrameProps) {
  return (
    <section className="section artifact-viewer" id="artifact-viewer" data-screen-label={screenLabel}>
      <header className="artifact-strip">
        <span className="section-eye">{eyebrow}</span>
        <p className="artifact-strip-title">{title}</p>
        <span className="artifact-date">{meta}</span>
        {note && <p className="artifact-note">{note}</p>}
        <a className="artifact-open" href={docPath}>
          Open standalone →
        </a>
      </header>
      <DocViewer docPath={docPath} key={docPath} />
    </section>
  );
}
