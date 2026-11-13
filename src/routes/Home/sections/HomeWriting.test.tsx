// ABOUTME: Tests the homepage's Writing section (#69) with the hook's fetch stubbed: verbatim copy,
// ABOUTME: the latest 3 posts and the Substack link; absent while pending and when posts failed or are empty.
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import full from '../../../../tests/fixtures/living/full.json';
import { resetLivingForTests } from '../../../hooks/useLiving';
import type { Living } from '../../../lib/living/contract';
import { HomeWriting } from './HomeWriting';

const FULL = full as Living;
const fetchMock = vi.fn();

function renderWith(body: unknown) {
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(body) });
  return render(
    <MemoryRouter>
      <HomeWriting />
    </MemoryRouter>,
  );
}

/** Let the stubbed fetch, its json() and React's commit all run. */
async function settle() {
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r, 0));
}

beforeEach(() => {
  resetLivingForTests();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('HomeWriting', () => {
  it('full fixture: the copy verbatim, the latest 3 posts and the Substack link', async () => {
    const post = FULL.posts.items[0]!;
    renderWith({
      ...FULL,
      posts: {
        ok: true,
        items: [...FULL.posts.items, { ...post, url: `${post.url}-4` }, { ...post, url: `${post.url}-5` }],
      },
    });
    expect(await screen.findByRole('heading', { level: 2 })).toHaveTextContent(/^Writing$/);
    expect(screen.getByText('From the Substack.')).toBeInTheDocument();
    const rows = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(within(rows[0]!).getByRole('link', { name: 'The coming storm' })).toHaveAttribute(
      'href',
      'https://weytani.substack.com/p/the-coming-storm',
    );
    expect(within(rows[0]!).getByText('11 Oct 2026')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All posts on the Substack →' })).toHaveAttribute(
      'href',
      'https://weytani.substack.com/',
    );
  });

  it('posts failed: no Writing heading, nothing rendered', async () => {
    const { container } = renderWith({ ...FULL, posts: { ok: false, items: [] } });
    await settle();
    expect(screen.queryByRole('heading', { name: 'Writing' })).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });

  it('posts empty: absent', async () => {
    const { container } = renderWith({ ...FULL, posts: { ok: true, items: [] } });
    await settle();
    expect(container).toBeEmptyDOMElement();
  });

  it('the whole fetch failed: absent', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const { container } = render(
      <MemoryRouter>
        <HomeWriting />
      </MemoryRouter>,
    );
    await settle();
    expect(container).toBeEmptyDOMElement();
  });

  it('pending: no heading, nothing rendered', () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { container } = render(
      <MemoryRouter>
        <HomeWriting />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('heading')).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });
});
