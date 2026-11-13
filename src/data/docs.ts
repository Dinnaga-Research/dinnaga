// ABOUTME: The Doc catalogue: every standalone doc served from public/artifact-docs/, and the one
// ABOUTME: source of truth for what is published to Atisha (publish: true) and what stays Behind the scenes.
import type { DocEntry, PublishedDoc } from '../types';

export const DOCS: DocEntry[] = [
  {
    slug: 'llm-best-practices-github-copilot',
    title: 'Applying LLM best practices in GitHub Copilot',
    project: 'Hermes',
    summary:
      'Twelve LLM best practices, each mapped to a setting, file or fence you can use in GitHub Copilot today.',
    published: '2026-09-09',
    docPath: '/artifact-docs/llm-best-practices-github-copilot.html',
    note: 'GitHub Copilot changes often, so check a control again before you set policy on it.',
    publish: true,
    kind: 'Cheat sheet',
    tested: 'Every control name checked against GitHub Docs on 9 Sep 2026.',
  },
  {
    slug: 'llm-best-practices-copilot-studio',
    title: 'Applying LLM best practices in Microsoft Copilot Studio',
    project: 'Hermes',
    summary:
      "The same twelve practices mapped onto Copilot Studio's controls, from topics and knowledge sources to DLP and the credit meter.",
    published: '2026-09-09',
    docPath: '/artifact-docs/llm-best-practices-copilot-studio.html',
    note: 'Copilot Studio changes often, so check a control again before you set policy on it.',
    publish: true,
    kind: 'Cheat sheet',
    tested: 'Every control name checked against Microsoft Learn on 9 Sep 2026.',
  },
  {
    slug: 'slamwich-tasting-report',
    title: 'SLAMWICH tasting report',
    project: 'Slamwich',
    summary: 'What 28 acclaimed portfolio sites have in common, and which techniques do the most work.',
    published: '2026-08-08',
    docPath: '/artifact-docs/slamwich-tasting-report.html',
    note: "Links to individual rebuilds point at a local development server (localhost:9021), so they don't open from this site.",
    publish: true,
    kind: 'Report',
    tested: '84 rebuilds of the 28 sites with the same content, compared trait by trait.',
  },
];

export function isPublished(doc: DocEntry): doc is PublishedDoc {
  return doc.publish === true && !!doc.kind && !!doc.tested;
}

/** Published Docs, newest `published` first, ties by title A to Z. */
export function publishedDocs(list: DocEntry[] = DOCS): PublishedDoc[] {
  return list
    .filter(isPublished)
    .sort((a, b) => b.published.localeCompare(a.published) || a.title.localeCompare(b.title));
}

/** Docs without `publish: true`, in catalogue order: the Behind the scenes list. */
export function unpublishedDocs(list: DocEntry[] = DOCS): DocEntry[] {
  return list.filter((d) => d.publish !== true);
}

export function docBySlug(slug: string | undefined, list: DocEntry[] = DOCS): DocEntry | undefined {
  return slug === undefined ? undefined : list.find((d) => d.slug === slug);
}
