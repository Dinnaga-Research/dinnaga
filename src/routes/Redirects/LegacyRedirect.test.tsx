// ABOUTME: Tests LegacyRedirect (#64): each old URL replaces itself with its new path, keeping the
// ABOUTME: query string and the hash, so the old URL leaves no history entry. Includes an unpublished fixture doc.
import { render, screen } from '@testing-library/react';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { DOCS } from '../../data/docs';
import type { DocEntry } from '../../types';
import { Backstage } from '../Backstage/Backstage';
import { BackstageDoc } from '../Backstage/BackstageDoc';
import { BackstageWeekly } from '../Backstage/BackstageWeekly';
import { NotFound } from '../NotFound/NotFound';
import { LegacyRedirect } from './LegacyRedirect';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// A Doc without `publish: true`. DOCS is read at call time, so adding it here covers legacyTarget,
// BackstageDoc and the index alike.
const draft: DocEntry = {
  slug: 'a-draft-doc',
  title: 'A draft doc',
  project: 'Test project',
  summary: 'One sentence about the draft.',
  published: '2026-03-04',
  docPath: '/artifact-docs/a-draft-doc.html',
  note: '',
};

beforeAll(() => {
  DOCS.push(draft);
});
afterAll(() => {
  DOCS.splice(DOCS.indexOf(draft), 1);
});
beforeEach(() => {
  mockFetch.mockResolvedValue({ ok: false, status: 404, text: vi.fn().mockResolvedValue('Not found') });
});

function land(path: string) {
  const router = createMemoryRouter(
    [
      { path: '/artifacts', element: <LegacyRedirect /> },
      { path: '/artifacts/:slug', element: <LegacyRedirect /> },
      { path: '/weekly', element: <LegacyRedirect /> },
      { path: '/weekly/:date', element: <LegacyRedirect /> },
      { path: '*', element: <p>landed</p> },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  const { pathname, search, hash } = router.state.location;
  return { to: pathname + search + hash, action: router.state.historyAction };
}

describe('LegacyRedirect', () => {
  it.each([
    ['/artifacts', '/backstage'],
    ['/artifacts/slamwich-tasting-report', '/atisha/slamwich-tasting-report'],
    ['/artifacts/llm-best-practices-copilot-studio#c07', '/atisha/llm-best-practices-copilot-studio#c07'],
    ['/artifacts/a-draft-doc', '/backstage/a-draft-doc'],
    ['/artifacts/a-draft-doc?x=1#c07', '/backstage/a-draft-doc?x=1#c07'],
    ['/artifacts/no-such-doc', '/backstage/no-such-doc'],
    ['/weekly', '/backstage/weekly'],
    ['/weekly?x=1#top', '/backstage/weekly?x=1#top'],
    ['/weekly/2026-08-08?x=1', '/backstage/weekly/2026-08-08?x=1'],
  ])('%s replaces itself with %s', (from, to) => {
    expect(land(from)).toEqual({ to, action: 'REPLACE' });
  });

  it('renders the 404 when mounted on a path that is not a legacy URL', () => {
    const router = createMemoryRouter([{ path: '/atisha', element: <LegacyRedirect /> }], {
      initialEntries: ['/atisha'],
    });
    render(<RouterProvider router={router} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page not found');
    expect(router.state.location.pathname).toBe('/atisha');
  });
});

// The whole chain on the real route shapes: an old URL ends on the page that now owns it.
describe('old URLs through the Behind the scenes routes', () => {
  function followed(path: string) {
    const router = createMemoryRouter(
      [
        { path: '/artifacts', element: <LegacyRedirect /> },
        { path: '/artifacts/:slug', element: <LegacyRedirect /> },
        { path: '/weekly', element: <LegacyRedirect /> },
        { path: '/backstage', element: <Backstage /> },
        { path: '/backstage/weekly', element: <BackstageWeekly /> },
        { path: '/backstage/:slug', element: <BackstageDoc /> },
        { path: '/atisha/:slug', element: <p>atisha doc</p> },
        { path: '*', element: <NotFound /> },
      ],
      { initialEntries: [path] },
    );
    render(<RouterProvider router={router} />);
    return router;
  }

  it('/artifacts shows the Behind the scenes index, listing the fixture doc', () => {
    const router = followed('/artifacts');
    expect(router.state.location.pathname).toBe('/backstage');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Behind the scenes');
    expect(screen.getByRole('link', { name: 'A draft doc' })).toHaveAttribute('href', '/backstage/a-draft-doc');
  });

  it('/artifacts/<unpublished> shows that doc in the reader frame', () => {
    const router = followed('/artifacts/a-draft-doc#c07');
    expect(router.state.location.pathname + router.state.location.hash).toBe('/backstage/a-draft-doc#c07');
    expect(screen.getByRole('link', { name: '← Behind the scenes' })).toHaveAttribute('href', '/backstage');
    expect(screen.getByText('Doc · Test project')).toBeInTheDocument();
  });

  it('/artifacts/<unknown> ends on the 404 at the new URL', () => {
    const router = followed('/artifacts/no-such-doc');
    expect(router.state.location.pathname).toBe('/backstage/no-such-doc');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page not found');
  });

  it('/weekly shows the weekly archive', () => {
    const router = followed('/weekly');
    expect(router.state.location.pathname).toBe('/backstage/weekly');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Weekly reports');
  });

  it('/artifacts/<published> goes straight to Atisha in one step', () => {
    const router = followed('/artifacts/slamwich-tasting-report');
    expect(router.state.location.pathname).toBe('/atisha/slamwich-tasting-report');
    expect(screen.getByText('atisha doc')).toBeInTheDocument();
  });
});
