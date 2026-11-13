// ABOUTME: Tests the paused weekly archive (/backstage/weekly, #64 and #37): the h1, the dated
// ABOUTME: intro, the paused line, and one row per run, newest first, linking /backstage/weekly/:date.
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { WEEKLY_RUNS } from '../../data/weeklyRuns';
import { formatDateRange } from '../../lib/dateFormat';
import { BackstageWeekly } from './BackstageWeekly';

function renderArchive() {
  return render(
    <MemoryRouter>
      <BackstageWeekly />
    </MemoryRouter>,
  );
}

describe('BackstageWeekly', () => {
  it('renders Weekly reports as the h1', () => {
    renderArchive();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^Weekly reports$/);
  });

  it('keeps the approved intro and says the series is paused, dated from the newest run', () => {
    renderArchive();
    expect(
      screen.getByText(
        'The lab ran a week-in-review pass over its own transcripts each Saturday. Each run links to its full report.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Paused since 26 Sep 2026.')).toBeInTheDocument();
    expect(screen.queryByText(/this week|every saturday/i)).toBeNull();
  });

  it('shows the paused line directly below the intro', () => {
    renderArchive();
    const intro = screen.getByText(/The lab ran a week-in-review pass/);
    const paused = screen.getByText('Paused since 26 Sep 2026.');
    expect(intro.compareDocumentPosition(paused) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('links each run as "Week in review, <range>" to /backstage/weekly/<date>', () => {
    renderArchive();
    const first = screen.getByRole('link', { name: 'Week in review, 3–8 Aug 2026' });
    expect(first).toHaveAttribute('href', '/backstage/weekly/2026-08-08');
    for (const r of WEEKLY_RUNS) {
      expect(screen.getByRole('link', { name: `Week in review, ${formatDateRange(r.windowStart, r.date)}` })).toHaveAttribute(
        'href',
        `/backstage/weekly/${r.date}`,
      );
    }
  });

  it('has no spaced em dash in a link and no ISO date in a link text', () => {
    renderArchive();
    for (const a of screen.getAllByRole('link')) {
      expect(a.textContent).not.toMatch(/ — /);
      expect(a.textContent).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    }
  });

  it('lists the runs newest first, each with its summary', () => {
    renderArchive();
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(WEEKLY_RUNS.map((r) => `/backstage/weekly/${r.date}`));
    expect(hrefs[0]).toBe('/backstage/weekly/2026-09-26');
    const oldest = screen.getByRole('link', { name: /3–8 Aug 2026/ }).closest('li')!;
    expect(within(oldest).getByText(/scout\/cook\/judge design-portfolio pipeline/)).toBeInTheDocument();
  });
});
