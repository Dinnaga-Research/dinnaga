// ABOUTME: The Substack source (#65): the publication's RSS feed (Substack sends no CORS header, which
// ABOUTME: is why this runs server-side), newest five posts. Sends no credentials.
import type { LivingPost } from '../../src/lib/living/contract.js';
import { fetchText } from './http.js';
import { parseRss } from './rss.js';

const FEED = 'https://weytani.substack.com/feed';
export const MAX_POSTS = 5;

/** The newest posts. Rejects on a non-2xx answer, a network error or a body that isn't a feed. */
export async function loadPosts(): Promise<LivingPost[]> {
  const reply = await fetchText(FEED, {
    Accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
    'User-Agent': 'dinnaga.ai-living',
  });
  if (!reply.ok) throw new Error(`Substack feed answered ${reply.status}`);
  return parseRss(reply.body).slice(0, MAX_POSTS);
}
