// ABOUTME: An unpublished doc (/backstage/:slug, #64) in the reader frame. A published slug replaces
// ABOUTME: itself with /atisha/:slug, keeping the query and hash; an unknown one renders the 404.
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { DocFrame } from '../../components/DocFrame';
import { DOCS, docBySlug, isPublished } from '../../data/docs';
import { formatPausedSince } from '../../lib/dateFormat';
import type { DocEntry } from '../../types';
import { NotFound } from '../NotFound/NotFound';

export function BackstageDoc({ docs = DOCS }: { docs?: DocEntry[] }) {
  const { slug } = useParams();
  const { search, hash } = useLocation();
  const doc = docBySlug(slug, docs);
  if (!doc) return <NotFound />;
  if (isPublished(doc)) return <Navigate replace to={{ pathname: `/atisha/${doc.slug}`, search, hash }} />;
  return (
    <DocFrame
      backHref="/backstage"
      backLabel="Behind the scenes"
      kind={`Doc · ${doc.project}`}
      colophonTitle={doc.title}
      dateLine={`Published ${formatPausedSince(doc.published)}`}
      note={doc.note || undefined}
      docPath={doc.docPath}
    />
  );
}
