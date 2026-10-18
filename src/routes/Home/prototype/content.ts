// ABOUTME: PROTOTYPE (throwaway, branch prototype/visual-directions) — the honest homepage content all
// ABOUTME: three visual directions render: the thesis, a sample Atisha launch set, terminal Fiction.
import { useEffect, useState } from 'react';
import type { BootLine } from '../../../types';

export const THESIS =
  'Dinnaga Research reads, tests and distils AI-assisted coding (papers, podcasts, vendor docs) into living documents engineers can use today.';

// Placeholder: how the homepage names the founder is "Decide the homepage's content and order".
export const FOUNDER = 'A lab run by David Ryan.';

export type DocKind = 'Cheat sheet' | 'Report' | 'Living document';

export interface LibraryDoc {
  title: string;
  kind: DocKind;
  date: string;
  tested: string;
  summary: string;
  href: string;
}

// Sample launch set. Which docs actually go public is the operator's call (homepage ticket).
export const LIBRARY: LibraryDoc[] = [
  {
    title: 'Applying LLM best practices in GitHub Copilot',
    kind: 'Cheat sheet',
    date: '2026-09-09',
    tested: 'Every control name checked against GitHub Docs on 9 Sep 2026.',
    summary: 'Twelve clauses of the hermes doctrine, each mapped to a setting, file or fence you can use in Copilot today.',
    href: '/artifacts/llm-best-practices-github-copilot',
  },
  {
    title: 'Applying LLM best practices in Microsoft Copilot Studio',
    kind: 'Cheat sheet',
    date: '2026-09-09',
    tested: 'Every control name checked against Microsoft Learn on 9 Sep 2026.',
    summary: 'The same twelve clauses resolved into Copilot Studio: topics before orchestration, named knowledge, DLP, the credit meter.',
    href: '/artifacts/llm-best-practices-copilot-studio',
  },
  {
    title: 'What 84 rebuilds of 28 portfolios teach about design',
    kind: 'Report',
    date: '2026-08-08',
    tested: '84 rebuilds of the same content, compared trait by trait.',
    summary: 'Design is the only variable across every dish in the kitchen, which makes the corpus a controlled experiment in visual identity.',
    href: '/artifacts/slamwich-tasting-report',
  },
];

// Living documents come from the local-only Quartz build (private vault, never committed).
export function useLivingDocs(limit = 3): LibraryDoc[] {
  const [docs, setDocs] = useState<LibraryDoc[]>([]);
  useEffect(() => {
    fetch('/prototype-quartz/manifest.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((pages: { slug: string; title: string }[]) =>
        setDocs(
          pages
            .filter((p) => p.slug.startsWith('wiki/') && !p.slug.endsWith('index') && !p.slug.includes('.base'))
            .slice(0, limit)
            .map((p) => ({
              title: p.title.replaceAll('-', ' ').replace(/^./, (c) => c.toUpperCase()),
              kind: 'Living document' as const,
              date: '2026-10-18',
              tested: 'Compiled from podcast episodes; every claim marked with its source.',
              summary: 'A living page from the lab wiki, rebuilt as new episodes are distilled.',
              href: `/artifacts/qz--${p.slug.replaceAll('/', '--')}`,
            })),
        ),
      )
      .catch(() => setDocs([]));
  }, [limit]);
  return docs;
}

// Fiction: the terminal as a behind-the-scenes easter egg. No fake measurements.
export const BOOT_LINES: BootLine[] = [
  { text: 'dinnaga research — behind the scenes', delay: 60 },
  { text: '', delay: 30 },
  { text: `atisha: ${LIBRARY.length} public docs`, delay: 60 },
  { text: 'everything else is backstage.', delay: 60 },
  { text: '', delay: 30 },
  { text: 'know the phrase? type it below.', delay: 60 },
];

export const NAV = [
  { label: 'Atisha', href: '/atisha' },
  { label: 'How we test', href: '/method' },
  { label: 'Colophon', href: '/colophon' },
];

export const FOOTER_LINKS = [
  { label: 'Source on GitHub', href: 'https://github.com/Dinnaga-Research/dinnaga' },
  { label: 'Substack', href: '#substack-url-pending' },
  { label: 'What we are building (living README)', href: '#living-readme-pending' },
];
