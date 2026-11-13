// ABOUTME: Artifact viewer route (/artifacts/:slug) — reader frame (bar, doc, colophon) around a
// ABOUTME: shadow-DOM viewer rendering the static doc; unknown slugs render NotFound.
import { useParams } from 'react-router-dom';
import { DocFrame } from '../../components/DocFrame';
import { ARTIFACTS } from '../../data/artifacts';
import { NotFound } from '../NotFound/NotFound';

export function ArtifactViewer() {
  const { slug } = useParams();
  const artifact = ARTIFACTS.find((a) => a.slug === slug);
  if (!artifact) return <NotFound />;
  return (
    <DocFrame
      backHref="/artifacts"
      backLabel="Behind the scenes"
      kind={`Doc \u00b7 ${artifact.project}`}
      colophonTitle={artifact.title}
      dateLine={`Published ${artifact.published}`}
      note={artifact.note || undefined}
      docPath={artifact.docPath}
    />
  );
}
