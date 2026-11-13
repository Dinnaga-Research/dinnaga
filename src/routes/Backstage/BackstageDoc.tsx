// ABOUTME: An unpublished doc (/backstage/:slug) in the reader frame. A published slug replaces
// ABOUTME: itself with /atisha/:slug; an unknown one renders the 404.
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { DocFrame } from '../../components/DocFrame';
import { docBySlug, isPublished } from '../../data/docs';
import { formatPausedSince } from '../../lib/dateFormat';
import { NotFound } from '../NotFound/NotFound';

export function BackstageDoc() {
  const { slug } = useParams();
  const { search, hash } = useLocation();
  const doc = docBySlug(slug);
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
