// ABOUTME: Shared TypeScript types for Dinnaga site content.
// ABOUTME: Consumed by data files in src/data/ and the components that render them.

export interface NavLink {
  label: string;
  to: string;
  // An off-site link: rendered as a plain <a> with an aria-hidden ↗ after the label.
  external?: boolean;
}

export type DocKind = 'Cheat sheet' | 'Report' | 'Living document';

/** One Doc in the catalogue. Without `publish: true` it lives Behind the scenes (#26, #63). */
export interface DocEntry {
  slug: string;
  title: string;
  project: string;
  // One sentence: the row summary on Atisha, the one-liner Behind the scenes, the route description.
  summary: string;
  // ISO date string (YYYY-MM-DD).
  published: string;
  // Root-relative URL of the static doc under public/.
  docPath: string;
  // '' = no caveat; non-empty = a caveat shown in the reader's colophon.
  note: string;
  publish?: true;
  kind?: DocKind;
  // What the doc was checked against, shown after the tested mark.
  tested?: string;
}

/** A Doc on Atisha: published, with its kind and tested line. */
export type PublishedDoc = DocEntry & { publish: true; kind: DocKind; tested: string };

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
