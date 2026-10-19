// ABOUTME: Shared TypeScript types for Dinnaga site content.
// ABOUTME: Consumed by data files in src/data/ and the components that render them.

export type PracticeIconName = 'ethos' | 'method' | 'atisha';

export interface Practice {
  num: string;
  title: string;
  icon: PracticeIconName;
  summary: string;
  body: string;
  meta: string;
}

export interface DataRow {
  idx: string;
  label: string;
  value: string;
}

export interface BootLine {
  text: string;
  delay: number;
}

export interface NavLink {
  label: string;
  to: string;
}

export type AtishaCategory = 'skill' | 'tool' | 'method' | 'paper';

export interface AtishaEntry {
  slug: string;
  title: string;
  category: AtishaCategory;
  oneLiner: string;
  sourceUrl: string;
  validatedOn: string;
  whyUseful: string;
  howValidated: string;
  // '' = first-party / no credit; non-empty = the third-party owner to credit.
  attribution: string;
}

export interface ArtifactEntry {
  slug: string;
  title: string;
  project: string;
  oneLiner: string;
  // ISO date string (YYYY-MM-DD).
  published: string;
  // Root-relative URL of the static doc under public/.
  docPath: string;
  // '' = no caveat; non-empty = a free-text caveat shown on the viewer page.
  note: string;
}

export interface WeeklyRun {
  // ISO date string (YYYY-MM-DD) of the Saturday run — the unique key.
  date: string;
  // ISO date string (YYYY-MM-DD) the reviewed window starts at.
  windowStart: string;
  // Human label for the reviewed window, e.g. "this week (since 2026-08-03)".
  windowLabel: string;
  // 1-2 sentence summary of the week.
  summary: string;
  // Root-relative URL of the static report under public/.
  docPath: string;
}

