// ABOUTME: DEV-only harness route (/dev/doc?path=...) — mounts any doc path in the reader frame.
// ABOUTME: Registered in App.tsx only when import.meta.env.DEV; absent from production builds.
import { useSearchParams } from 'react-router-dom';
import { DocFrame } from '../../components/DocFrame';
import { NotFound } from '../NotFound/NotFound';

export function DevDoc() {
  const [params] = useSearchParams();
  const path = params.get('path');
  if (!path) return <NotFound />;
  return (
    <DocFrame
      backHref="/"
      backLabel="Home"
      kind="Living document"
      colophonTitle="Dev harness"
      dateLine={path}
      docPath={path}
    />
  );
}
