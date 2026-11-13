// ABOUTME: Tests /atisha/:slug (#63): a published Doc mounts in the reader frame with the back link, its
// ABOUTME: kind, Open standalone and the tested line; an unknown or unpublished slug renders the 404.
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DocEntry } from '../../types';
import { AtishaDoc } from './AtishaDoc';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const FIXTURE_PUBLISHED: DocEntry = {
  slug: 'fixture-sheet',
  title: 'Fixture sheet',
  project: 'Fixture',
  summary: 'A published fixture Doc.',
  published: '2026-10-02',
  docPath: '/artifact-docs/fixture-sheet.html',
  note: 'A fixture caveat.',
  publish: true,
  kind: 'Living document',
  tested: 'Checked against the fixture on 2 Oct 2026.',
};

const FIXTURE_HIDDEN: DocEntry = {
  slug: 'fixture-hidden',
  title: 'Fixture hidden',
  project: 'Fixture',
  summary: 'An unpublished fixture Doc.',
  published: '2026-10-03',
  docPath: '/artifact-docs/fixture-hidden.html',
  note: '',
};

function renderAt(path: string, docs?: DocEntry[]) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/atisha/:slug" element={<AtishaDoc docs={docs} />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AtishaDoc', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: false, status: 404, text: vi.fn().mockResolvedValue('Not found') });
  });

  it('mounts a published launch Doc with ← Atisha, its kind and Open standalone in the bar', () => {
    renderAt('/atisha/llm-best-practices-github-copilot');
    const bar = screen.getByRole('navigation', { name: 'Doc' });
    expect(within(bar).getByRole('link', { name: '← Atisha' })).toHaveAttribute('href', '/atisha');
    expect(within(bar).getByText('Cheat sheet')).toBeInTheDocument();
    expect(within(bar).getByRole('link', { name: 'Open standalone' })).toHaveAttribute(
      'href',
      '/artifact-docs/llm-best-practices-github-copilot.html',
    );
  });

  it('shows the tested line, title, date and note in the About this doc colophon', () => {
    renderAt('/atisha/slamwich-tasting-report');
    const colophon = screen.getByRole('heading', { level: 2, name: 'About this doc' }).closest('footer')!;
    expect(within(colophon).getByText('SLAMWICH tasting report')).toBeInTheDocument();
    const tested = colophon.querySelector('.tested-line')!;
    expect(tested.textContent).toBe('84 rebuilds of the 28 sites with the same content, compared trait by trait.');
    expect(tested.querySelector('.tested-mark')).toHaveAttribute('aria-hidden', 'true');
    expect(within(colophon).getByText('Published 8 Aug 2026')).toBeInTheDocument();
    expect(within(colophon).getByText(/localhost:9021/)).toBeInTheDocument();
  });

  it('reads the catalogue it is given, so any published Doc mounts', () => {
    renderAt('/atisha/fixture-sheet', [FIXTURE_PUBLISHED, FIXTURE_HIDDEN]);
    const bar = screen.getByRole('navigation', { name: 'Doc' });
    expect(within(bar).getByText('Living document')).toBeInTheDocument();
    expect(document.querySelector('.doc-colophon .tested-line')?.textContent).toBe(
      'Checked against the fixture on 2 Oct 2026.',
    );
  });

  it('renders the 404 for a Doc without publish: true', () => {
    renderAt('/atisha/fixture-hidden', [FIXTURE_PUBLISHED, FIXTURE_HIDDEN]);
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Doc' })).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('renders the 404 for an unknown slug and for a weekly date', () => {
    const { unmount } = renderAt('/atisha/no-such-doc');
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    unmount();
    renderAt('/atisha/2026-08-08');
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
  });
});
