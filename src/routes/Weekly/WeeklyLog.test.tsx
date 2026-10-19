// ABOUTME: Tests the /weekly run-log page — renders every run newest-first with its
// ABOUTME: window label, run date, and summary, linking each into the /weekly/:date viewer.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { WEEKLY_RUNS } from '../../data/weeklyRuns';
import { WeeklyLog } from './WeeklyLog';

describe('WeeklyLog', () => {
  it('renders the section heading', () => {
    render(<MemoryRouter><WeeklyLog /></MemoryRouter>);
    expect(screen.getByText('// WEEKLY')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('shows date range and paused message', () => {
    render(<MemoryRouter><WeeklyLog /></MemoryRouter>);
    expect(screen.getByText('3–8 Aug 2026')).toBeInTheDocument();
    expect(screen.getByText('Paused since 26 Sep 2026.')).toBeInTheDocument();
  });

  it('renders the seed run with date range, run date, and summary', () => {
    render(<MemoryRouter><WeeklyLog /></MemoryRouter>);
    expect(screen.getByText('3–8 Aug 2026')).toBeInTheDocument();
    expect(screen.getByText(/run 2026-08-08/)).toBeInTheDocument();
    expect(screen.getByText(/scout\/cook\/judge design-portfolio pipeline/)).toBeInTheDocument();
  });

  it('links the seed run to its viewer page', () => {
    render(<MemoryRouter><WeeklyLog /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /2026-08-08/ })).toHaveAttribute(
      'href',
      '/weekly/2026-08-08',
    );
  });

  it('lists runs newest-first', () => {
    render(<MemoryRouter><WeeklyLog /></MemoryRouter>);
    const hrefs = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'))
      .filter((h) => h?.startsWith('/weekly/'));
    const expected = [...WEEKLY_RUNS]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((r) => `/weekly/${r.date}`);
    expect(hrefs).toEqual(expected);
  });
});
