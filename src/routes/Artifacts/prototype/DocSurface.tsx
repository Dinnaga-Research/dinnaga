// ABOUTME: PROTOTYPE (throwaway) — renders one doc either in an open shadow root (via adapter.ts) or in
// ABOUTME: today's iframe, keyed by doc + options so each change gets a fresh host and shadow root.
import { useEffect, useRef, useState } from 'react';
import { mountDoc, type Heading, type MountStats, type Scheme, type Scope } from './adapter';

export type Renderer = 'shadow' | 'iframe';

interface DocSurfaceProps {
  docPath: string;
  title: string;
  renderer: Renderer;
  scheme: Scheme;
  scope: Scope;
  onInternalLink: (slug: string) => void;
  onMounted: (stats: MountStats | null, headings: Heading[], error?: string) => void;
}

function ShadowHost({ docPath, scheme, scope, onInternalLink, onMounted }: Omit<DocSurfaceProps, 'renderer' | 'title'>) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>();
  useEffect(() => {
    const ctl = new AbortController();
    mountDoc(ref.current!, docPath, { scheme, scope, onInternalLink }, ctl.signal)
      .then((r) => onMounted(r.stats, r.headings))
      .catch((e: Error) => {
        if (ctl.signal.aborted) return;
        setError(e.message);
        onMounted(null, [], e.message);
      });
    return () => ctl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      {error && (
        <p className="proto-doc-error">
          Couldn't mount this doc: {error}. <a href={docPath}>Open standalone</a>
        </p>
      )}
      <div ref={ref} className="proto-doc-host" />
    </>
  );
}

export function DocSurface(props: DocSurfaceProps) {
  const { renderer, docPath, title, scheme, scope, onMounted } = props;
  useEffect(() => {
    if (renderer === 'iframe') onMounted(null, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderer, docPath]);
  if (renderer === 'iframe') return <iframe className="artifact-frame" src={docPath} title={title} />;
  return <ShadowHost key={`${docPath}|${scheme}|${scope}`} {...props} />;
}
