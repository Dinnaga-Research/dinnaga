// ABOUTME: Artifact viewer route (/artifacts/:slug) — compact header strip over a
// ABOUTME: full-bleed iframe rendering the static doc; unknown slugs render NotFound.
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
      eyebrow={artifact.project}
      title={artifact.title}
      meta={`published ${artifact.published}`}
      note={artifact.note || undefined}
      docPath={artifact.docPath}
      screenLabel={artifact.project}
    />
  );
}
