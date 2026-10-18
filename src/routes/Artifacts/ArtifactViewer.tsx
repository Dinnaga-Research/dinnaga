// ABOUTME: Artifact viewer route (/artifacts/:slug). On branch prototype/doc-viewer it mounts the
// ABOUTME: throwaway doc-viewer prototype; main keeps the compact strip over an iframe.
import { PrototypeDocViewer } from './prototype/PrototypeDocViewer';

export function ArtifactViewer() {
  return <PrototypeDocViewer />;
}
