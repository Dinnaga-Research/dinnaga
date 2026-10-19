// ABOUTME: Tests the /artifacts/:slug viewer — header strip metadata, the doc iframe's
// ABOUTME: src/title attributes (jsdom never loads iframes), and NotFound on unknown slugs.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ArtifactViewer } from './ArtifactViewer';

function renderViewer(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/artifacts/${slug}`]}>
      <Routes>
        <Route path="/artifacts/:slug" element={<ArtifactViewer />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ArtifactViewer', () => {
  it('renders the header strip for a valid slug', () => {
    renderViewer('slamwich-tasting-report');
    expect(
      screen.getByRole('heading', { name: 'SLAMWICH Tasting Report' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Slamwich')).toBeInTheDocument();
    expect(screen.getByText(/published 2026-08-08/)).toBeInTheDocument();
    expect(screen.getByText(/localhost:9021/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open standalone/i })).toHaveAttribute(
      'href',
      '/artifact-docs/slamwich-tasting-report.html',
    );
  });

  it('renders the doc iframe with the artifact title and docPath src', () => {
    renderViewer('slamwich-tasting-report');
    const frame = screen.getByTitle('SLAMWICH Tasting Report');
    expect(frame.tagName).toBe('IFRAME');
    expect(frame).toHaveAttribute('src', '/artifact-docs/slamwich-tasting-report.html');
  });

  it('renders NotFound content for an unknown slug', () => {
    renderViewer('no-such-artifact');
    expect(screen.getByText(/404/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to base/i })).toHaveAttribute('href', '/');
  });
});
