// ABOUTME: Text for the living rows (#66): api/living's ISO timestamps in the site's `9 Sep 2026`
// ABOUTME: format (UTC), and a repository's meta line with the stars rule and the release.
import { formatPausedSince } from '../../lib/dateFormat';
import type { LivingRepo } from '../../lib/living/contract';

/** An ISO timestamp as `9 Sep 2026`, by its UTC date. Anything unreadable passes through as is. */
export function livingDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return formatPausedSince(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`);
}

/** `Pushed <date>`, then ` · <n> stars` from 1 star up, then ` · release <tag>` when there is one. */
export function repoMeta(repo: LivingRepo): string {
  const parts = [`Pushed ${livingDate(repo.pushedAt)}`];
  if (repo.stars >= 1) parts.push(repo.stars === 1 ? '1 star' : `${repo.stars} stars`);
  if (repo.release) parts.push(`release ${repo.release}`);
  return parts.join(' · ');
}
