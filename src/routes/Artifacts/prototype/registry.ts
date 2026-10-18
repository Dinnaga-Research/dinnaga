// ABOUTME: PROTOTYPE (throwaway) — every test doc the viewer prototype can open: the 3 artifacts, the 8
// ABOUTME: weekly reports, and the local-only Quartz build of wrinklemaxx wiki pages (never committed).
import { ARTIFACTS } from '../../../data/artifacts';
import { WEEKLY_RUNS } from '../../../data/weeklyRuns';

export type DocKind = 'artifact' | 'weekly' | 'wiki';

export interface ProtoDoc {
  key: string;
  kind: DocKind;
  eyebrow: string;
  title: string;
  meta: string;
  note?: string;
  docPath: string;
}

export const quartzKey = (slug: string) => `qz--${slug.replaceAll('/', '--')}`;

export const STATIC_DOCS: ProtoDoc[] = [
  ...ARTIFACTS.map((a) => ({
    key: a.slug,
    kind: 'artifact' as const,
    eyebrow: `// ${a.project}`,
    title: a.title,
    meta: `published ${a.published}`,
    note: a.note || undefined,
    docPath: a.docPath,
  })),
  ...WEEKLY_RUNS.map((r) => ({
    key: `weekly-${r.date}`,
    kind: 'weekly' as const,
    eyebrow: '// WEEK IN REVIEW',
    title: r.windowLabel,
    meta: `run ${r.date}`,
    docPath: r.docPath,
  })),
];

export async function loadQuartzDocs(): Promise<ProtoDoc[]> {
  try {
    const res = await fetch('/prototype-quartz/manifest.json');
    if (!res.ok) return [];
    const pages: { slug: string; title: string }[] = await res.json();
    return pages.map((p) => ({
      key: quartzKey(p.slug),
      kind: 'wiki' as const,
      eyebrow: '// WRINKLEMAXX WIKI · QUARTZ v5',
      title: p.title.replaceAll('-', ' '),
      meta: `local build of 3_Knowledge/${p.slug}.md`,
      note: 'Private vault content, served locally only. Not in git.',
      docPath: `/prototype-quartz/${p.slug}.html`,
    }));
  } catch {
    return [];
  }
}
