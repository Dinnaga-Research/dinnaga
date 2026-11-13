// ABOUTME: Tests a weekly report (/backstage/weekly/:date, #64): the reader frame with the
// ABOUTME: Weekly reports back link and the report's own file; an unknown date is the 404.
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { BackstageWeeklyDoc } from './BackstageWeeklyDoc';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function open(path: string) {
  const router = createMemoryRouter([{ path: '/backstage/weekly/:date', element: <BackstageWeeklyDoc /> }], {
    initialEntries: [path],
  });
  render(<RouterProvider router={router} />);
  return router;
}

describe('BackstageWeeklyDoc', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, text: vi.fn().mockResolvedValue('Not found') });
  });

  it('shows a known report in the reader frame with the Weekly reports back link', () => {
    open('/backstage/weekly/2026-08-08');
    const bar = screen.getByRole('navigation', { name: 'Doc' });
    expect(within(bar).getByRole('link', { name: '← Weekly reports' })).toHaveAttribute('href', '/backstage/weekly');
    expect(within(bar).getByText('Weekly report')).toBeInTheDocument();
    expect(within(bar).getByRole('link', { name: 'Open standalone' })).toHaveAttribute(
      'href',
      '/artifact-docs/weekly/2026-08-08.html',
    );
  });

  it('names the report and its window in the colophon, with no tested line', () => {
    open('/backstage/weekly/2026-08-08');
    const colophon = screen.getByRole('heading', { level: 2, name: 'About this doc' }).closest('footer')!;
    expect(within(colophon).getByText('Weekly report')).toHaveClass('doc-colophon-title');
    expect(within(colophon).getByText('Run 2026-08-08, covering 2026-08-03 to 2026-08-08')).toBeInTheDocument();
    expect(colophon.querySelector('.tested-line')).toBeNull();
  });

  it('shows the 404 for an unknown date and keeps the URL', () => {
    const router = open('/backstage/weekly/2026-01-01');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page not found');
    expect(router.state.location.pathname).toBe('/backstage/weekly/2026-01-01');
  });

  it('shows the 404 for a date-shaped string that is not a run', () => {
    open('/backstage/weekly/not-a-date');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page not found');
  });
});
