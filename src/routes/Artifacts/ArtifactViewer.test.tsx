// ABOUTME: Tests the /artifacts/:slug viewer — reader frame, the doc viewer
// ABOUTME: in shadow DOM, and NotFound on unknown slugs.
import { render, screen, within } from '@testing-library/react';
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
  it.each([
    ['slamwich-tasting-report', 'Doc \u00b7 Slamwich', 'SLAMWICH Tasting Report', 'Published 2026-08-08', /localhost:9021/, '/artifact-docs/slamwich-tasting-report.html'],
    ['llm-best-practices-copilot-studio', 'Doc \u00b7 Hermes', 'Applying LLM Best Practices in Microsoft Copilot Studio', 'Published 2026-09-09', /Copilot Studio surfaces move fast/, '/artifact-docs/llm-best-practices-copilot-studio.html'],
    ['llm-best-practices-github-copilot', 'Doc \u00b7 Hermes', 'Applying LLM Best Practices in GitHub Copilot', 'Published 2026-09-09', /Control names verified/, '/artifact-docs/llm-best-practices-github-copilot.html'],
  ])('renders the reader frame for %s', (slug, kind, title, dateLine, note, docPath) => {
    renderViewer(slug);
    const bar = screen.getByRole('navigation', { name: 'Doc' });
    expect(within(bar).getByRole('link', { name: '\u2190 Behind the scenes' })).toHaveAttribute('href', '/artifacts');
    expect(within(bar).getByText(kind)).toBeInTheDocument();
    expect(within(bar).getByRole('link', { name: 'Open standalone' })).toHaveAttribute('href', docPath);
    const colophon = screen.getByRole('heading', { level: 2, name: 'About this doc' }).closest('footer')!;
    expect(within(colophon).getByRole('heading', { level: 2, name: 'About this doc' })).toBeInTheDocument();
    expect(within(colophon).getByText(title).tagName).toBe('STRONG');
    expect(within(colophon).getByText(dateLine)).toBeInTheDocument();
    expect(within(colophon).getByText(note)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });

  it('renders the doc viewer with shadow DOM mounting', () => {
    const { container } = renderViewer('slamwich-tasting-report');
    const host = container.querySelector('[data-doc-host]');
    expect(host).toBeInTheDocument();
  });

  it('renders NotFound content for an unknown slug', () => {
    renderViewer('no-such-artifact');
    expect(screen.getByText(/404/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to base/i })).toHaveAttribute('href', '/');
  });
});
