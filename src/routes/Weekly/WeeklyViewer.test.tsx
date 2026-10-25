// ABOUTME: Tests the /weekly/:date viewer — DocFrame strip metadata, the report viewer
// ABOUTME: in shadow DOM, and NotFound on unknown dates.
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { WeeklyViewer } from './WeeklyViewer';

function renderViewer(date: string) {
  return render(
    <MemoryRouter initialEntries={[`/weekly/${date}`]}>
      <Routes>
        <Route path="/weekly/:date" element={<WeeklyViewer />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('WeeklyViewer', () => {
  it('renders the reader frame for a valid date', () => {
    renderViewer('2026-08-08');
    const bar = screen.getByRole('navigation', { name: 'Doc' });
    expect(within(bar).getByRole('link', { name: '\u2190 Weekly reports' })).toHaveAttribute('href', '/weekly');
    expect(within(bar).getByText('Weekly report')).toBeInTheDocument();
    expect(within(bar).getByRole('link', { name: 'Open standalone' })).toHaveAttribute(
      'href',
      '/artifact-docs/weekly/2026-08-08.html',
    );
    const colophon = screen.getByRole('heading', { level: 2, name: 'About this doc' }).closest('footer')!;
    expect(within(colophon).getByRole('heading', { level: 2, name: 'About this doc' })).toBeInTheDocument();
    expect(within(colophon).getByText('Weekly report').tagName).toBe('STRONG');
    expect(within(colophon).getByText('Run 2026-08-08, covering 2026-08-03 to 2026-08-08')).toBeInTheDocument();
    // Weekly reports carry no note
    expect(colophon.querySelector('.doc-colophon-note')).toBeNull();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });

  it('renders the report viewer with shadow DOM mounting', () => {
    const { container } = renderViewer('2026-08-08');
    const host = container.querySelector('[data-doc-host]');
    expect(host).toBeInTheDocument();
  });

  it('renders NotFound content for an unknown date', () => {
    renderViewer('1999-12-31');
    expect(screen.getByText(/404/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to base/i })).toHaveAttribute('href', '/');
  });
});
