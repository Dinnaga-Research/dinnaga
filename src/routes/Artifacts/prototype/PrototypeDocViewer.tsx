// ABOUTME: PROTOTYPE (throwaway) — /artifacts/:slug on branch prototype/doc-viewer: any test doc, three
// ABOUTME: frames (?variant=A|B|C), shadow vs iframe, forced-dark vs OS scheme, and the adapter's state.
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PrototypeSwitcher } from '../../../components/PrototypeSwitcher';
import { NotFound } from '../../NotFound/NotFound';
import type { Heading, MountStats, Scheme, Scope } from './adapter';
import { DocSurface, type Renderer } from './DocSurface';
import { loadQuartzDocs, quartzKey, STATIC_DOCS, type ProtoDoc } from './registry';
import { VariantA, VariantB, VariantC } from './variants';
import './prototype.css';

const VARIANTS = { A: VariantA, B: VariantB, C: VariantC };
const VARIANT_LIST = Object.entries(VARIANTS).map(([key, V]) => ({ key, label: (V as unknown as { label: string }).label }));

export function PrototypeDocViewer() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<ProtoDoc[] | null>(null);
  const [stats, setStats] = useState<MountStats | null>(null);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    loadQuartzDocs().then((q) => setDocs([...STATIC_DOCS, ...q]));
  }, []);

  const variant = (params.get('variant') ?? 'A') as keyof typeof VARIANTS;
  const renderer = (params.get('renderer') ?? 'shadow') as Renderer;
  const scheme = (params.get('scheme') ?? 'dark') as Scheme;
  const scope = (params.get('scope') ?? 'page') as Scope;
  const showStats = params.get('stats') !== '0';
  const set = (k: string, v: string) =>
    setParams((p) => {
      p.set(k, v);
      return p;
    }, { replace: true });
  const keep = () => {
    const p = new URLSearchParams(params);
    return p.toString() ? `?${p}` : '';
  };

  if (!docs) return <p className="proto-loading">Loading test docs…</p>;
  const doc = docs.find((d) => d.key === slug);
  if (!doc) return <NotFound />;

  const open = (key: string) => {
    window.scrollTo(0, 0);
    navigate(`/artifacts/${key}${keep()}`);
  };
  const onJump = (id: string) => {
    const root = document.querySelector('.proto-doc-host')?.shadowRoot;
    root?.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };
  const V = VARIANTS[variant] ?? VariantA;
  const surface = (
    <DocSurface
      key={`${doc.docPath}|${renderer}`}
      docPath={doc.docPath}
      title={doc.title}
      renderer={renderer}
      scheme={scheme}
      scope={scope}
      onInternalLink={(s) => open(quartzKey(s))}
      onMounted={(st, hs, err) => {
        setStats(st);
        setHeadings(hs);
        setError(err);
      }}
    />
  );
  const groups: [string, ProtoDoc[]][] = [
    ['Artifacts', docs.filter((d) => d.kind === 'artifact')],
    ['Weekly reports', docs.filter((d) => d.kind === 'weekly')],
    ['wrinklemaxx wiki (Quartz)', docs.filter((d) => d.kind === 'wiki')],
  ];

  return (
    <>
      <V doc={doc} surface={surface} headings={headings} onJump={onJump} />
      <PrototypeSwitcher variants={VARIANT_LIST}>
        <div className="proto-switcher-row proto-knobs">
          <label>
            Doc
            <select value={doc.key} onChange={(e) => open(e.target.value)}>
              {groups.map(([g, list]) => (
                <optgroup key={g} label={g}>
                  {list.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label>
            Render
            <select value={renderer} onChange={(e) => set('renderer', e.target.value)}>
              <option value="shadow">shadow DOM</option>
              <option value="iframe">iframe (today)</option>
            </select>
          </label>
          <label>
            Scheme
            <select value={scheme} onChange={(e) => set('scheme', e.target.value)} disabled={renderer === 'iframe'}>
              <option value="dark">forced dark</option>
              <option value="os">follow OS</option>
            </select>
          </label>
          <label>
            Quartz
            <select value={scope} onChange={(e) => set('scope', e.target.value)} disabled={doc.kind !== 'wiki' || renderer === 'iframe'}>
              <option value="page">whole page</option>
              <option value="article">article only</option>
            </select>
          </label>
          <label className="proto-check">
            <input type="checkbox" checked={showStats} onChange={(e) => set('stats', e.target.checked ? '1' : '0')} />
            state
          </label>
        </div>
        {showStats && (
          <pre className="proto-stats">
            {renderer === 'iframe'
              ? 'iframe: no adapter runs; the doc is its own browsing context.'
              : error
                ? `mount failed: ${error}`
                : stats
                  ? formatStats(stats)
                  : 'mounting…'}
          </pre>
        )}
      </PrototypeSwitcher>
    </>
  );
}

function formatStats(s: MountStats): string {
  const lines = [
    `${s.generator} · ${s.ms} ms · CSS ${(s.cssBytes / 1024).toFixed(0)} kB from ${s.sheetsFetched} fetched sheet(s) + inline · ${s.rules} rules`,
    `rewrote: ${s.selectorsRewritten} root selectors · ${s.mediaSchemeRewritten} scheme queries · ${s.mediaToContainer} width @media→@container · ${s.vwToCqi} vw→cqi`,
    `hoisted ${s.fontFacesHoisted} @font-face · dropped ${s.importsDropped} @import · stripped ${s.scriptsStripped} scripts, ${s.handlersStripped} handlers · ${s.urlsAbsolutised} URLs absolutised`,
    `doc has: ${s.docMains} <main>, ${s.docH1s} <h1>, ${s.callouts} callouts, ${s.mermaidBlocks} mermaid · position:fixed rules ${s.fixedRules} · vh rules ${s.viewportHeightRules} · overflow ${s.overflowPx}px`,
  ];
  if (s.sheetsFailed.length) lines.push(`FAILED sheets: ${s.sheetsFailed.join(', ')}`);
  for (const w of s.warnings) lines.push(`warn: ${w}`);
  return lines.join('\n');
}
