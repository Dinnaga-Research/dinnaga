// ABOUTME: A small RSS 2.0 reader for the Substack feed: title, link and pubDate of each <item>,
// ABOUTME: newest first. Handles CDATA and entities; no dependency. Throws when the body isn't a feed.
import type { LivingPost } from '../../src/lib/living/contract';

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decodeEntities(text: string): string {
  return text.replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi, (whole, dec, hex, name) => {
    if (name) return ENTITIES[name.toLowerCase()] ?? whole;
    const code = dec ? Number.parseInt(dec, 10) : Number.parseInt(hex, 16);
    return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
  });
}

// CDATA is lifted out first (and put back as raw text), so markup inside a post body
// can never be mistaken for the item's own <title> or <link>.
const MARK = '\uE000';
const SLOT = new RegExp(`${MARK}(\\d+)${MARK}`, 'g');

function field(item: string, tag: string, cdata: string[]): string | null {
  const match = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`).exec(item);
  if (!match) return null;
  const text = decodeEntities(match[1]!).replace(SLOT, (_, i) => cdata[Number(i)]!);
  return text.trim() || null;
}

export function parseRss(xml: string): LivingPost[] {
  if (!/<(?:rss|channel)[\s>]/.test(xml)) throw new Error('not an RSS feed');

  const cdata: string[] = [];
  const stripped = xml.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (_, body: string) => {
    cdata.push(body);
    return `${MARK}${cdata.length - 1}${MARK}`;
  });

  const blocks = stripped.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/g) ?? [];
  const posts: LivingPost[] = [];
  for (const block of blocks) {
    const title = field(block, 'title', cdata);
    const url = field(block, 'link', cdata);
    const date = field(block, 'pubDate', cdata);
    const time = date ? Date.parse(date) : Number.NaN;
    if (!title || !url || Number.isNaN(time)) continue;
    posts.push({ title, url, publishedAt: new Date(time).toISOString() });
  }
  if (blocks.length > 0 && posts.length === 0) throw new Error('RSS items could not be read');

  return posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
