// ABOUTME: An Atisha doc (/atisha/:slug) in the reader frame, with its kind and tested line.
// ABOUTME: An unknown slug, or one without publish: true, renders the 404 and keeps the URL.
import { useParams } from 'react-router-dom';
import { DocFrame } from '../../components/DocFrame';
import { DOCS, docBySlug, isPublished } from '../../data/docs';
import { formatPausedSince } from '../../lib/dateFormat';
import type { DocEntry } from '../../types';
import { NotFound } from '../NotFound/NotFound';

export function AtishaDoc({ docs = DOCS }: { docs?: DocEntry[] }) {
  const { slug } = useParams();
  const doc = docBySlug(slug, docs);
  if (!doc || !isPublished(doc)) return <NotFound />;
  return (
    <DocFrame
      backHref="/atisha"
      backLabel="Atisha"
      kind={doc.kind}
      colophonTitle={doc.title}
      dateLine={`Published ${formatPausedSince(doc.published)}`}
      note={doc.note || undefined}
      tested={doc.tested}
      docPath={doc.docPath}
    />
  );
}
