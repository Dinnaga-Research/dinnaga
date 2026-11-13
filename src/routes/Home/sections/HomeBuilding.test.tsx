// ABOUTME: Tests the homepage's What we're building section (#69) with the hook's fetch stubbed:
// ABOUTME: verbatim copy, 3 repositories and 3 gists, a failed or empty sub-list left out, absent while pending.
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import full from '../../../../tests/fixtures/living/full.json';
import failed from '../../../../tests/fixtures/living/failed.json';
import { resetLivingForTests } from '../../../hooks/useLiving';
import type { Living } from '../../../lib/living/contract';
import { HomeBuilding } from './HomeBuilding';

const FULL = full as Living;
const fetchMock = vi.fn();
const settled = vi.fn();

function renderWith(body: unknown) {
  fetchMock.mockImplementation(() => {
    const res = { ok: true, status: 200, json: () => Promise.resolve(body).finally(() => settled()) };
    return Promise.resolve(res);
  });
  return render(
    <MemoryRouter>
      <HomeBuilding />
    </MemoryRouter>,
  );
}

/** Wait until the hook has the body, plus a tick for React to commit. */
async function settle() {
  await waitFor(() => expect(settled).toHaveBeenCalled());
  await new Promise((r) => setTimeout(r, 0));
}

const heading = () => screen.queryByRole('heading', { level: 2, name: "What we're building" });
const list = (name: string) => screen.queryByRole('list', { name });

beforeEach(() => {
  resetLivingForTests();
  fetchMock.mockReset();
  settled.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('HomeBuilding', () => {
  it('full fixture: the copy verbatim, 3 repositories, 3 gists and the link to /building', async () => {
    renderWith(FULL);
    expect(await screen.findByRole('heading', { level: 2 })).toHaveTextContent(/^What we're building$/);
    expect(screen.getByText('Recent repositories and gists, updated automatically.')).toBeInTheDocument();
    expect(within(list('Repositories')!).getAllByRole('listitem')).toHaveLength(3);
    expect(within(list('Gists')!).getAllByRole('listitem')).toHaveLength(3);
    expect(within(list('Repositories')!).getByRole('link', { name: 'dinnaga' })).toBeInTheDocument();
    expect(within(list('Gists')!).getByText('Updated 18 Oct 2026')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Everything we're building →" })).toHaveAttribute(
      'href',
      '/building',
    );
  });

  it('repos failed: the gists list renders alone', async () => {
    renderWith({ ...FULL, repos: { ok: false, items: [] } });
    expect(await screen.findByRole('heading', { level: 2 })).toBeInTheDocument();
    expect(list('Repositories')).toBeNull();
    expect(screen.queryByText('Repositories')).toBeNull();
    expect(within(list('Gists')!).getAllByRole('listitem')).toHaveLength(3);
  });

  it('gists empty: the repositories list renders alone', async () => {
    renderWith({ ...FULL, gists: { ok: true, items: [] } });
    expect(await screen.findByRole('heading', { level: 2 })).toBeInTheDocument();
    expect(list('Gists')).toBeNull();
    expect(within(list('Repositories')!).getAllByRole('listitem')).toHaveLength(3);
  });

  it('repos and gists both failed: no heading, nothing rendered', async () => {
    const { container } = renderWith(failed);
    await settle();
    expect(heading()).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });

  it('repos failed and gists empty: absent', async () => {
    const { container } = renderWith({ ...FULL, repos: { ok: false, items: [] }, gists: { ok: true, items: [] } });
    await settle();
    expect(container).toBeEmptyDOMElement();
  });

  it('the whole fetch failed: absent', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const { container } = render(
      <MemoryRouter>
        <HomeBuilding />
      </MemoryRouter>,
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 0));
    expect(container).toBeEmptyDOMElement();
  });

  it('pending: no heading, nothing rendered', () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { container } = render(
      <MemoryRouter>
        <HomeBuilding />
      </MemoryRouter>,
    );
    expect(heading()).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });
});
