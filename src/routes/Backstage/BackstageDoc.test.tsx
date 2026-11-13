// ABOUTME: Tests an unpublished doc (/backstage/:slug, #64): the reader frame with the Behind the
// ABOUTME: scenes back link and "Doc · project" kind; a published slug redirects; an unknown one is the 404.
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router-dom';
import type { DocEntry } from '../../types';
import { BackstageDoc } from './BackstageDoc';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const draft: DocEntry = {
  slug: 'a-draft-doc',
  title: 'A draft doc',
  project: 'Test project',
  summary: 'One sentence about the draft.',
  published: '2026-03-04',
  docPath: '/artifact-docs/a-draft-doc.html',
  note: 'Check this before you rely on it.',
};

function Landed() {
  const { pathname, search, hash } = useLocation();
  return <p data-testid="landed">{pathname + search + hash}</p>;
}

function open(path: string, docs?: DocEntry[]) {
  const router = createMemoryRouter(
    [
      { path: '/backstage/:slug', element: <BackstageDoc docs={docs} /> },
      { path: '/atisha/:slug', element: <Landed /> },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe('BackstageDoc', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, text: vi.fn().mockResolvedValue('Not found') });
  });

  it('shows an unpublished doc in the reader frame: back link, kind and standalone link', () => {
    open('/backstage/a-draft-doc', [draft]);
    const bar = screen.getByRole('navigation', { name: 'Doc' });
    expect(within(bar).getByRole('link', { name: '← Behind the scenes' })).toHaveAttribute('href', '/backstage');
    expect(within(bar).getByText('Doc · Test project')).toBeInTheDocument();
    expect(within(bar).getByRole('link', { name: 'Open standalone' })).toHaveAttribute(
      'href',
      '/artifact-docs/a-draft-doc.html',
    );
  });

  it('puts the title, the date and the note in the colophon, with no tested line', () => {
    open('/backstage/a-draft-doc', [draft]);
    const colophon = screen.getByRole('heading', { level: 2, name: 'About this doc' }).closest('footer')!;
    expect(within(colophon).getByText('A draft doc')).toHaveClass('doc-colophon-title');
    expect(within(colophon).getByText('Published 4 Mar 2026')).toBeInTheDocument();
    expect(within(colophon).getByText('Check this before you rely on it.')).toBeInTheDocument();
    expect(colophon.querySelector('.tested-line')).toBeNull();
  });

  it('replaces a published slug with /atisha/:slug, keeping the query string and the hash', () => {
    const router = open('/backstage/slamwich-tasting-report?x=1#c07');
    expect(screen.getByTestId('landed')).toHaveTextContent('/atisha/slamwich-tasting-report?x=1#c07');
    expect(router.state.historyAction).toBe('REPLACE');
  });

  it('shows the 404 for an unknown slug and keeps the URL', () => {
    const router = open('/backstage/no-such-doc');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page not found');
    expect(router.state.location.pathname).toBe('/backstage/no-such-doc');
  });
});
