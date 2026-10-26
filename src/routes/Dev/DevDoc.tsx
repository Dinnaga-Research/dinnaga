// ABOUTME: DEV-only harness route (/dev/doc?path=...) — mounts any doc path in the reader frame.
// ABOUTME: Registered in App.tsx only when import.meta.env.DEV; Quartz slugs map back onto this route.
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DocFrame } from '../../components/DocFrame';
import { fixtureBase, quartzDocPath } from '../../lib/docViewer/quartz';
import { NotFound } from '../NotFound/NotFound';

export function DevDoc() {
  const [params] = useSearchParams();
  const path = params.get('path');
  const base = path ? fixtureBase(path) : '';
  const toRoute = useCallback(
    (slug: string, hash: string) => '/dev/doc?path=' + encodeURIComponent(quartzDocPath(base, slug)) + hash,
    [base],
  );
  if (!path) return <NotFound />;
  return (
    <DocFrame
      backHref="/"
      backLabel="Home"
      kind="Living document"
      colophonTitle="Dev harness"
      dateLine={path}
      docPath={path}
      toRoute={toRoute}
    />
  );
}
