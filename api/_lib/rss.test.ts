// @vitest-environment node
// ABOUTME: Tests parseRss() against the recorded Substack feed and hand-made edge cases:
// ABOUTME: CDATA titles, ISO dates, newest first, entities, markup inside CDATA, junk input.
import { describe, expect, it } from 'vitest';
import { fixtureText } from '../__fixtures__/index.js';
import { parseRss } from './rss.js';

const feed = fixtureText('substack-feed.xml');

const wrap = (items: string) =>
  `<?xml version="1.0"?><rss version="2.0"><channel><title>Channel</title>` +
  `<link>https://example.test/</link>${items}</channel></rss>`;

describe('parseRss', () => {
  it('returns title, link and an ISO publishedAt for each item, reading CDATA titles', () => {
    expect(parseRss(feed)).toEqual([
      {
        title: 'The coming storm',
        url: 'https://weytani.substack.com/p/the-coming-storm',
        publishedAt: '2026-10-11T05:39:24.000Z',
      },
      {
        title: 'The conversation has shifted',
        url: 'https://weytani.substack.com/p/the-conversation-has-shifted',
        publishedAt: '2026-02-20T14:45:25.000Z',
      },
      {
        title: 'Just the beginning...',
        url: 'https://weytani.substack.com/p/just-the-beginning',
        publishedAt: '2024-12-18T05:20:21.000Z',
      },
    ]);
  });

  it('sorts newest first whatever the order in the feed', () => {
    const items = feed.match(/<item>[\s\S]*?<\/item>/g)!;
    const scrambled = feed.replace(
      /<item>[\s\S]*<\/item>/,
      [items[1], items[2], items[0]].join(''),
    );
    expect(parseRss(scrambled).map((p) => p.title)).toEqual([
      'The coming storm',
      'The conversation has shifted',
      'Just the beginning...',
    ]);
  });

  it('ignores the channel title and link, which sit outside any item', () => {
    expect(parseRss(feed).map((p) => p.title)).not.toContain('HCI');
  });

  it('decodes entities in plain-text titles and trims whitespace', () => {
    const xml = wrap(
      `<item><title>  Tom &amp; Jerry&#39;s &lt;b&gt; &quot;day&quot;  </title>` +
        `<link>\n https://example.test/p/1 \n</link>` +
        `<pubDate>Mon, 01 Jun 2026 08:00:00 GMT</pubDate></item>`,
    );
    expect(parseRss(xml)).toEqual([
      {
        title: `Tom & Jerry's <b> "day"`,
        url: 'https://example.test/p/1',
        publishedAt: '2026-06-01T08:00:00.000Z',
      },
    ]);
  });

  it('is not fooled by tags inside a CDATA body', () => {
    const xml = wrap(
      `<item><title><![CDATA[Real]]></title>` +
        `<content:encoded><![CDATA[<h1>x</h1><title>Wrong</title><link>https://wrong.test/</link></item>]]></content:encoded>` +
        `<link>https://example.test/p/real</link>` +
        `<pubDate>Mon, 01 Jun 2026 08:00:00 GMT</pubDate></item>`,
    );
    expect(parseRss(xml)).toEqual([
      {
        title: 'Real',
        url: 'https://example.test/p/real',
        publishedAt: '2026-06-01T08:00:00.000Z',
      },
    ]);
  });

  it('skips an item with no title, no link or an unreadable date', () => {
    const good = `<item><title>Good</title><link>https://example.test/g</link><pubDate>Mon, 01 Jun 2026 08:00:00 GMT</pubDate></item>`;
    const xml = wrap(
      good +
        `<item><link>https://example.test/a</link><pubDate>Mon, 01 Jun 2026 08:00:00 GMT</pubDate></item>` +
        `<item><title>No link</title><pubDate>Mon, 01 Jun 2026 08:00:00 GMT</pubDate></item>` +
        `<item><title>Bad date</title><link>https://example.test/b</link><pubDate>last week</pubDate></item>`,
    );
    expect(parseRss(xml).map((p) => p.title)).toEqual(['Good']);
  });

  it('returns an empty list for a feed with no items', () => {
    expect(parseRss(wrap(''))).toEqual([]);
  });

  it('throws on a body that is not a feed, so the source fails', () => {
    expect(() => parseRss('<html><body>Just a moment...</body></html>')).toThrow(/feed/i);
    expect(() => parseRss('')).toThrow(/feed/i);
  });

  it('throws when the feed has items but none can be read', () => {
    expect(() => parseRss(wrap(`<item><title>Only a title</title></item>`))).toThrow(/items/i);
  });
});
