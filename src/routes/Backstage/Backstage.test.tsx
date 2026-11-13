// ABOUTME: Tests the Behind the scenes index (/backstage, #64): h1 and lede verbatim, the list of
// ABOUTME: unpublished docs or its empty line, and the Weekly reports link with its computed line.
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { DocEntry, WeeklyRun } from '../../types';
import { Backstage } from './Backstage';

const draft: DocEntry = {
  slug: 'a-draft-doc',
  title: 'A draft doc',
  project: 'Test project',
  summary: 'One sentence about the draft.',
  published: '2026-03-04',
  docPath: '/artifact-docs/a-draft-doc.html',
  note: '',
};

const run = (date: string, windowStart: string): WeeklyRun => ({
  date,
  windowStart,
  windowLabel: 'unused',
  summary: 'unused',
  docPath: `/artifact-docs/weekly/${date}.html`,
});

function renderIndex(props: Parameters<typeof Backstage>[0] = {}) {
  return render(
    <MemoryRouter>
      <Backstage {...props} />
    </MemoryRouter>,
  );
}

describe('Backstage', () => {
  it('renders the h1 and the lede verbatim', () => {
    renderIndex();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^Behind the scenes$/);
    expect(
      screen.getByText(
        "Docs we haven't published to Atisha, and the paused weekly archive. These pages are unlisted, and their files are public in the site's source.",
      ),
    ).toBeInTheDocument();
  });

  it('with no unpublished docs (true today) says so and lists no docs', () => {
    renderIndex();
    expect(screen.getByText('No unpublished docs right now.')).toBeInTheDocument();
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/backstage/weekly']);
  });

  it('with one unpublished doc lists it, linked to /backstage/<slug>, and drops the empty line', () => {
    renderIndex({ docs: [draft] });
    expect(screen.queryByText('No unpublished docs right now.')).toBeNull();
    const link = screen.getByRole('link', { name: 'A draft doc' });
    expect(link).toHaveAttribute('href', '/backstage/a-draft-doc');
    const row = link.closest('li')!;
    expect(within(row).getByText('One sentence about the draft.')).toBeInTheDocument();
    expect(within(row).getByText('Test project · 4 Mar 2026')).toBeInTheDocument();
  });

  it('lists every unpublished doc, in the order given', () => {
    const second = { ...draft, slug: 'second-draft', title: 'Second draft' };
    renderIndex({ docs: [draft, second] });
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/backstage/a-draft-doc', '/backstage/second-draft', '/backstage/weekly']);
  });

  it('links Weekly reports with the line computed from the real data', () => {
    renderIndex();
    const link = screen.getByRole('link', { name: 'Weekly reports' });
    expect(link).toHaveAttribute('href', '/backstage/weekly');
    expect(within(link.closest('li')!).getByText('8 reports, paused since 26 Sep 2026')).toBeInTheDocument();
  });

  it('computes the count and the newest date from whatever runs it is given', () => {
    renderIndex({ runs: [run('2026-10-03', '2026-09-28'), run('2026-10-17', '2026-10-12'), run('2026-10-10', '2026-10-05')] });
    expect(screen.getByText('3 reports, paused since 17 Oct 2026')).toBeInTheDocument();
  });

  it('says "1 report" for a single run', () => {
    renderIndex({ runs: [run('2026-10-03', '2026-09-28')] });
    expect(screen.getByText('1 report, paused since 3 Oct 2026')).toBeInTheDocument();
  });

  it('keeps the Weekly reports link, without a count, when there are no runs', () => {
    renderIndex({ runs: [] });
    expect(screen.getByRole('link', { name: 'Weekly reports' })).toHaveAttribute('href', '/backstage/weekly');
    expect(screen.queryByText(/paused since/)).toBeNull();
  });

  it('has exactly one h1 and no link to Atisha, the library or the homepage', () => {
    renderIndex({ docs: [draft] });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.queryByRole('link', { name: /atisha|homepage/i })).toBeNull();
  });
});
