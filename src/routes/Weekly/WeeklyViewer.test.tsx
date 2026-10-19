// ABOUTME: Tests the /weekly/:date viewer — DocFrame strip metadata, the report iframe's
// ABOUTME: src/title attributes (jsdom never loads iframes), and NotFound on unknown dates.
import { render, screen } from '@testing-library/react';
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
  it('renders the header strip for a valid date', () => {
    renderViewer('2026-08-08');
    expect(screen.getByText('// WEEK IN REVIEW')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '3–8 Aug 2026' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/run 2026-08-08/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open standalone/i })).toHaveAttribute(
      'href',
      '/artifact-docs/weekly/2026-08-08.html',
    );
  });

  it('renders the report iframe with the date range title and docPath src', () => {
    renderViewer('2026-08-08');
    const frame = screen.getByTitle('3–8 Aug 2026');
    expect(frame.tagName).toBe('IFRAME');
    expect(frame).toHaveAttribute('src', '/artifact-docs/weekly/2026-08-08.html');
  });

  it('renders NotFound content for an unknown date', () => {
    renderViewer('1999-12-31');
    expect(screen.getByText(/404/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to base/i })).toHaveAttribute('href', '/');
  });
});
