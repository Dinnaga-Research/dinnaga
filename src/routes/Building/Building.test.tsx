// ABOUTME: Tests /building (#66) with the hook's fetch stubbed: the copy, the three columns and their
// ABOUTME: rows, the per-column loading, failed and empty states, and each column's closing link.
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import full from '../../../tests/fixtures/living/full.json';
import { resetLivingForTests } from '../../hooks/useLiving';
import type { Living } from '../../lib/living/contract';
import { Building } from './Building';

const FULL = full as Living;
const fetchMock = vi.fn();

const ok = (body: unknown) => ({ ok: true, status: 200, json: () => Promise.resolve(body) });

function renderPage() {
  return render(
    <MemoryRouter>
      <Building />
    </MemoryRouter>,
  );
}

const column = (name: string) => screen.getByRole('region', { name });
const rows = (name: string) => within(column(name)).queryAllByRole('listitem');

/** Render with a body and wait for the columns to settle. */
async function renderWith(body: unknown) {
  fetchMock.mockResolvedValue(ok(body));
  renderPage();
  await waitFor(() => expect(column('Repositories')).not.toHaveAttribute('aria-busy', 'true'));
}

const LINKS = {
  Repositories: ['weytani on GitHub →', 'https://github.com/weytani'],
  Writing: ['All posts on the Substack →', 'https://weytani.substack.com/'],
  Gists: ['All gists on GitHub →', 'https://gist.github.com/weytani'],
} as const;

beforeEach(() => {
  resetLivingForTests();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Building with the full fixture', () => {
  it('renders the h1, the lede and the three column h2s verbatim, in order', async () => {
    await renderWith(FULL);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe("What we're building");
    expect(
      screen.getByText(
        'Recent repositories, Substack posts and public gists from Dinnaga Research, pulled from GitHub and the Substack about once an hour.',
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Repositories',
      'Writing',
      'Gists',
    ]);
  });

  it('lists every repository with its fields', async () => {
    await renderWith(FULL);
    const repos = rows('Repositories');
    expect(repos).toHaveLength(FULL.repos.items.length);
    const [first, second, third, fourth] = repos;
    expect(within(first!).getByText('Dinnaga-Research')).toBeInTheDocument();
    expect(within(first!).getByRole('link', { name: 'dinnaga' })).toHaveAttribute(
      'href',
      'https://github.com/Dinnaga-Research/dinnaga',
    );
    expect(within(first!).getByText('Pushed 12 Nov 2026')).toBeInTheDocument();
    expect(within(second!).getByRole('link', { name: 'living-graph' })).toBeInTheDocument();
    expect(within(second!).getByText('Pushed 18 Oct 2026 · release v0.2.0')).toBeInTheDocument();
    expect(within(third!).getByText('Pushed 5 Aug 2026 · 3 stars')).toBeInTheDocument();
    expect(within(fourth!).getByText('Pushed 3 Aug 2026 · 1 star')).toBeInTheDocument();
    expect(within(fourth!).getByText(FULL.repos.items[3]!.description)).toBeInTheDocument();
  });

  it('lists the posts with their dates and the gists with "Updated <date>"', async () => {
    await renderWith(FULL);
    const posts = rows('Writing');
    expect(posts).toHaveLength(3);
    expect(within(posts[0]!).getByRole('link', { name: 'The coming storm' })).toHaveAttribute(
      'href',
      'https://weytani.substack.com/p/the-coming-storm',
    );
    expect(within(posts[0]!).getByText('11 Oct 2026')).toBeInTheDocument();
    const gists = rows('Gists');
    expect(gists).toHaveLength(4);
    expect(within(gists[1]!).getByRole('link', { name: 'fixture-notes.md' })).toBeInTheDocument();
    expect(within(gists[1]!).getByText('Updated 6 Oct 2026')).toBeInTheDocument();
  });

  it('ends each column with the link to where its data lives', async () => {
    await renderWith(FULL);
    for (const [name, [text, href]] of Object.entries(LINKS)) {
      const links = within(column(name)).getAllByRole('link');
      expect(links.at(-1)).toHaveAccessibleName(text);
      expect(links.at(-1)).toHaveAttribute('href', href);
    }
  });

  it('shows at most 5 posts and at most 20 gists', async () => {
    const post = FULL.posts.items[0]!;
    const gist = FULL.gists.items[0]!;
    await renderWith({
      ...FULL,
      posts: { ok: true, items: Array.from({ length: 7 }, (_, i) => ({ ...post, url: `${post.url}-${i}` })) },
      gists: { ok: true, items: Array.from({ length: 25 }, (_, i) => ({ ...gist, url: `${gist.url}-${i}` })) },
    });
    expect(rows('Writing')).toHaveLength(5);
    expect(rows('Gists')).toHaveLength(20);
  });

  it('carries no "open source" wording', async () => {
    await renderWith(FULL);
    expect(document.body.textContent).not.toMatch(/open[- ]source/i);
  });
});

describe('Building states', () => {
  it('while loading, each column is aria-busy and shows no placeholder text', () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    renderPage();
    for (const name of Object.keys(LINKS)) {
      const col = column(name);
      expect(col).toHaveAttribute('aria-busy', 'true');
      expect(col.textContent).toBe(name);
    }
  });

  it('only repos failed: Repositories shows the failure line and the GitHub link, the others render', async () => {
    await renderWith({ ...FULL, repos: { ok: false, items: [] } });
    const repos = column('Repositories');
    expect(within(repos).getByText("Couldn't load right now.")).toBeInTheDocument();
    expect(within(repos).getByRole('link', { name: 'weytani on GitHub →' })).toHaveAttribute(
      'href',
      'https://github.com/weytani',
    );
    expect(rows('Repositories')).toHaveLength(0);
    expect(rows('Writing')).toHaveLength(3);
    expect(rows('Gists')).toHaveLength(4);
    expect(screen.getAllByText("Couldn't load right now.")).toHaveLength(1);
  });

  it('the fetch rejects: all three columns show the failure line and their link', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    renderPage();
    await waitFor(() => expect(screen.getAllByText("Couldn't load right now.")).toHaveLength(3));
    for (const [name, [text, href]] of Object.entries(LINKS)) {
      const col = column(name);
      expect(col).not.toHaveAttribute('aria-busy', 'true');
      expect(within(col).getByText("Couldn't load right now.")).toBeInTheDocument();
      expect(within(col).getByRole('link', { name: text })).toHaveAttribute('href', href);
    }
  });

  it('a non-JSON body counts as failed', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: () => Promise.reject(new SyntaxError('<!doctype')) });
    renderPage();
    await waitFor(() => expect(screen.getAllByText("Couldn't load right now.")).toHaveLength(3));
  });

  it('empty gists: the Gists column shows "None right now." and its link', async () => {
    await renderWith({ ...FULL, gists: { ok: true, items: [] } });
    const gists = column('Gists');
    expect(within(gists).getByText('None right now.')).toBeInTheDocument();
    expect(within(gists).getByRole('link', { name: 'All gists on GitHub →' })).toBeInTheDocument();
    expect(rows('Gists')).toHaveLength(0);
    expect(screen.getAllByText('None right now.')).toHaveLength(1);
    expect(screen.queryByText("Couldn't load right now.")).toBeNull();
  });
});
